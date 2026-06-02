const mongoose = require('mongoose');

class AnalyticsBuffer {
  constructor() {
    this.queue = [];
    this.limit = 100;
    this.flushIntervalMs = 5000;
    this.intervalId = null;

    this.startInterval();
  }

  startInterval() {
    this.intervalId = setInterval(() => this.flush(), this.flushIntervalMs);
  }

  push(visitData) {
    this.queue.push(visitData);
    if (this.queue.length >= this.limit) {
      console.log(`🚀 Analytics Buffer reached capacity (${this.queue.length}). Flushing immediately.`);
      this.flush();
    }
  }

  async flush() {
    if (this.queue.length === 0) return;

    // Snapshot the current queue and empty the main queue to process safely
    const batch = [...this.queue];
    this.queue = [];

    try {
      // Dynamic import to prevent circular dependency bugs
      const Visit = require('../models/Visit');
      const ShortURL = require('../models/ShortURL');

      console.log(`📦 Flushing ${batch.length} click analytics to MongoDB...`);

      // 1. Bulk insert all granular Visit records
      await Visit.insertMany(batch);

      // 2. Aggregate clicks by URL ID to minimize database writes
      const clickAggregates = {};
      const latestVisits = {};

      batch.forEach(visit => {
        const urlId = visit.shortUrl.toString();
        clickAggregates[urlId] = (clickAggregates[urlId] || 0) + 1;
        
        const timestamp = new Date(visit.timestamp);
        if (!latestVisits[urlId] || timestamp > latestVisits[urlId]) {
          latestVisits[urlId] = timestamp;
        }
      });

      // 3. Formulate bulk updates for precomputed statistics
      const bulkOps = Object.keys(clickAggregates)
        .filter(urlId => mongoose.Types.ObjectId.isValid(urlId))
        .map(urlId => ({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(urlId) },
            update: {
              $inc: { clicks: clickAggregates[urlId] },
              // Set last visited timestamp if applicable
              $set: { lastVisitedAt: latestVisits[urlId] }
            }
          }
        }));

      if (bulkOps.length > 0) {
        await ShortURL.bulkWrite(bulkOps);
      }

      console.log(`✅ Success: ${batch.length} visits buffered, aggregates pre-computed!`);
    } catch (error) {
      console.error('❌ Analytics Buffer Flush Error:', error);
      // Re-insert failed items back to queue to ensure no data loss
      this.queue = [...batch, ...this.queue];
    }
  }

  // Graceful shutdown helper
  async shutdown() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    await this.flush();
  }
}

// Export singleton instance
module.exports = new AnalyticsBuffer();
