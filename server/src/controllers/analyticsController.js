const ShortURL = require('../models/ShortURL');
const Visit = require('../models/Visit');

// @desc    Get detailed analytics for a shortened URL
// @route   GET /api/urls/:id/analytics
// @access  Private
const getURLAnalytics = async (req, res) => {
  try {
    const urlId = req.params.id;
    const userId = req.user._id;

    // 1. Verify URL ownership
    const url = await ShortURL.findOne({ _id: urlId, user: userId, isDeleted: false });
    if (!url) {
      return res.status(404).json({ success: false, message: 'URL not found or unauthorized.' });
    }

    // 2. Fetch the 50 most recent visit logs
    const recentVisits = await Visit.find({ shortUrl: urlId })
      .sort({ timestamp: -1 })
      .limit(50);

    // 3. Aggregate Browser Splits
    const browserSplits = await Visit.aggregate([
      { $match: { shortUrl: url._id } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 4. Aggregate Device Splits
    const deviceSplits = await Visit.aggregate([
      { $match: { shortUrl: url._id } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 5. Aggregate Country Splits
    const countrySplits = await Visit.aggregate([
      { $match: { shortUrl: url._id } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 6. Aggregate Daily Clicks for the past 7 days
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
      analytics: {
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
    console.error('Analytics Controller Error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving analytics.' });
  }
};

// @desc    Get recent visits across all URLs owned by the user
// @route   GET /api/urls/analytics/recent
// @access  Private
const getGlobalRecentVisits = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get all active URL IDs for this user
    const urls = await ShortURL.find({ user: userId, isDeleted: false }).select('_id shortCode');
    const urlIds = urls.map(u => u._id);

    // 2. Fetch the 50 most recent visits across all of this user's links
    const recentVisits = await Visit.find({ shortUrl: { $in: urlIds } })
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('shortUrl', 'shortCode title');

    // 3. Aggregate Browser Splits across all user's URLs
    const browserSplits = await Visit.aggregate([
      { $match: { shortUrl: { $in: urlIds } } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 4. Aggregate Device Splits across all user's URLs
    const deviceSplits = await Visit.aggregate([
      { $match: { shortUrl: { $in: urlIds } } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 5. Aggregate OS Splits across all user's URLs
    const osSplits = await Visit.aggregate([
      { $match: { shortUrl: { $in: urlIds } } },
      { $group: { _id: '$os', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 6. Aggregate Country Splits across all user's URLs (limit to top 5)
    const countrySplits = await Visit.aggregate([
      { $match: { shortUrl: { $in: urlIds } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // 7. Calculate daily clicks trends for the last 7 days
    const dailyTrends = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      
      const count = await Visit.countDocuments({
        shortUrl: { $in: urlIds },
        timestamp: { $gte: start, $lt: end }
      });
      
      dailyTrends.push({
        label: days[d.getDay()],
        value: count
      });
    }

    // 8. Calculate weekly clicks trends for the last 4 weeks
    const weeklyTrends = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      
      const count = await Visit.countDocuments({
        shortUrl: { $in: urlIds },
        timestamp: { $gte: start, $lt: end }
      });
      weeklyTrends.push({
        label: `Week ${4 - i}`,
        value: count
      });
    }

    // 9. Calculate monthly clicks trends for the last 6 months
    const monthlyTrends = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      
      const count = await Visit.countDocuments({
        shortUrl: { $in: urlIds },
        timestamp: { $gte: start, $lt: end }
      });
      monthlyTrends.push({
        label: months[d.getMonth()],
        value: count
      });
    }

    const uniqueIPsList = await Visit.distinct('ip', { shortUrl: { $in: urlIds } });
    const countriesList = await Visit.distinct('country', { shortUrl: { $in: urlIds } });

    return res.json({
      success: true,
      visits: recentVisits,
      browsers: browserSplits.map(b => ({ name: b._id || 'Unknown', count: b.count })),
      devices: deviceSplits.map(d => ({ name: d._id || 'Desktop', count: d.count })),
      osList: osSplits.map(o => ({ name: o._id || 'Unknown', count: o.count })),
      countries: countrySplits.map(c => ({ name: c._id || 'Localhost', count: c.count })),
      trends: {
        daily: dailyTrends,
        weekly: weeklyTrends,
        monthly: monthlyTrends
      },
      uniqueVisitorsCount: uniqueIPsList.length,
      countriesCount: countriesList.length
    });
  } catch (error) {
    console.error('Global Recent Visits Error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving recent visits.' });
  }
};

module.exports = {
  getURLAnalytics,
  getGlobalRecentVisits
};
