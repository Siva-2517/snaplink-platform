const mongoose = require('mongoose');

class AnalyticsBuffer {
  constructor() {
    this.queue = [];
    this.limit = 100;
    this.maxQueueSize = 5000;
    this.flushIntervalMs = 5000;
    this.intervalId = null;
    this.isFlushing = false;

    this.startInterval();
  }

  startInterval() {
    this.intervalId = setInterval(() => this.flush(), this.flushIntervalMs);
    if (this.intervalId && typeof this.intervalId.unref === 'function') {
      this.intervalId.unref();
    }
  }

  push(visitData) {
    if (this.queue.length >= this.maxQueueSize) {
      console.warn(
        `⚠️ Analytics Buffer reached maximum ceiling (${this.maxQueueSize}). Dropping oldest visit record to prevent OOM.`
      );
      this.queue.shift();
    }

    this.queue.push(visitData);

    if (this.queue.length >= this.limit && !this.isFlushing) {
      this.flush();
    }
  }

  async flush() {
    if (this.queue.length === 0 || this.isFlushing) return;

    this.isFlushing = true;
    const batch = [...this.queue];
    this.queue = [];

    try {
      const Visit = require('../models/Visit');
      const ShortURL = require('../models/ShortURL');

      // 1. Bulk insert all granular Visit records
      await Visit.insertMany(batch, { ordered: false });

      // 2. Aggregate clicks by URL ID to minimize database writes
      const clickAggregates = {};
      const latestVisits = {};

      batch.forEach((visit) => {
        if (!visit.shortUrl) return;
        const urlId = visit.shortUrl.toString();
        clickAggregates[urlId] = (clickAggregates[urlId] || 0) + 1;

        const timestamp = new Date(visit.timestamp);
        if (!latestVisits[urlId] || timestamp > latestVisits[urlId]) {
          latestVisits[urlId] = timestamp;
        }
      });

      // 3. Formulate bulk updates for precomputed statistics
      const bulkOps = Object.keys(clickAggregates)
        .filter((urlId) => mongoose.Types.ObjectId.isValid(urlId))
        .map((urlId) => ({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(urlId) },
            update: {
              $inc: { clicks: clickAggregates[urlId] },
              $set: { lastVisitedAt: latestVisits[urlId] }
            }
          }
        }));

      if (bulkOps.length > 0) {
        await ShortURL.bulkWrite(bulkOps);
      }
    } catch (error) {
      console.error('❌ Analytics Buffer Flush Error:', error.message);
      // Re-queue with bounded backpressure
      const combined = [...batch, ...this.queue];
      if (combined.length > this.maxQueueSize) {
        console.warn(
          `⚠️ Dropping ${combined.length - this.maxQueueSize} backlogged analytics records due to buffer overflow.`
        );
        this.queue = combined.slice(-this.maxQueueSize);
      } else {
        this.queue = combined;
      }
    } finally {
      this.isFlushing = false;
    }
  }

  // Graceful shutdown helper
  async shutdown() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    await this.flush();
  }
}

// Export singleton instance
module.exports = new AnalyticsBuffer();
