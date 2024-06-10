const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Tweet = mongoose.model('Tweet');
const { requireUser } = require('../../config/passport');
const validateTweetInput = require('../../validations/tweets');

// Get all tweets
router.get('/', async (req, res) => {
  try {
    const tweets = await Tweet.find()
                              .populate('author', '_id username')
                              .sort({ createdAt: -1 });
    return res.json(tweets);
  } catch (err) {
    console.error('Error fetching tweets:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tweets by user ID
router.get('/user/:userId', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const tweets = await Tweet.find({ author: user._id })
                              .sort({ createdAt: -1 })
                              .populate('author', '_id username');
    return res.json(tweets);
  } catch (err) {
    console.error('Error fetching tweets by user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tweet by ID
router.get('/:id', async (req, res, next) => {
  try {
    const tweet = await Tweet.findById(req.params.id)
                             .populate('author', '_id username');
    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }
    return res.json(tweet);
  } catch (err) {
    console.error('Error fetching tweet by ID:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new tweet
router.post('/', requireUser, validateTweetInput, async (req, res, next) => {
  try {
    const newTweet = new Tweet({
      text: req.body.text,
      author: req.user._id
    });
    let tweet = await newTweet.save();
    tweet = await tweet.populate('author', '_id username').execPopulate();
    return res.json(tweet);
  } catch (err) {
    console.error('Error creating tweet:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;