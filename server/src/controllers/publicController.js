const ShortURL = require('../models/ShortURL');
const Visit = require('../models/Visit');

// @desc    Get public stats for a shortened URL (no auth required)
// @route   GET /api/public/stats/:shortCode
// @access  Public
const getPublicStats = async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Find URL by shortCode or customAlias
    const url = await ShortURL.findOne({
      $or: [
        { shortCode: shortCode },
        { customAlias: shortCode }
      ],
      isDeleted: false
    });

    if (!url) {
      return res.status(404).json({ success: false, message: 'Short URL not found.' });
    }

    // Check expiration
    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'This link has expired.' });
    }

    // Fetch the 20 most recent visits (limited for public view)
    const recentVisits = await Visit.find({ shortUrl: url._id })
      .sort({ timestamp: -1 })
      .limit(20)
      .select('timestamp browser os device country -_id');

    // Aggregate Browser Splits
    const browserSplits = await Visit.aggregate([
      { $match: { shortUrl: url._id } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Aggregate Device Splits
    const deviceSplits = await Visit.aggregate([
      { $match: { shortUrl: url._id } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Aggregate Country Splits
    const countrySplits = await Visit.aggregate([
      { $match: { shortUrl: url._id } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Daily click trends for the past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyClicksAggregate = await Visit.aggregate([
      {
        $match: {
          shortUrl: url._id,
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format daily clicks into a continuous 7-day array
    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const foundMatch = dailyClicksAggregate.find(item => item._id === dateStr);
      dailyTrends.push({
        date: dateStr,
        clicks: foundMatch ? foundMatch.clicks : 0
      });
    }

    return res.json({
      success: true,
      stats: {
        title: url.title,
        shortCode: url.shortCode,
        longUrl: url.longUrl,
        totalClicks: url.clicks,
        lastVisitedAt: url.lastVisitedAt || null,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt || null,
        dailyTrends,
        browsers: browserSplits.map(b => ({ name: b._id || 'Unknown', count: b.count })),
        devices: deviceSplits.map(d => ({ name: d._id || 'Desktop', count: d.count })),
        countries: countrySplits.map(c => ({ name: c._id || 'Localhost', count: c.count })),
        recentVisits
      }
    });
  } catch (error) {
    console.error('Public Stats Error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving public stats.' });
  }
};

module.exports = { getPublicStats };
