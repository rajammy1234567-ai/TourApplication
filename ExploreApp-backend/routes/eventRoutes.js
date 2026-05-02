const router = require("express").Router();
const { getEvents } = require("../controllers/eventController");

router.get("/", getEvents);

module.exports = router;