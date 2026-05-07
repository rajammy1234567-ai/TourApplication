const cron = require("node-cron");
const { fetchEventsFromAPI } = require("../services/eventServices");

const startCron = () => {
  cron.schedule("0 */6 * * *", async () => {
    console.log("Running Event Sync...");
    await fetchEventsFromAPI();
  });
};

module.exports = { startCron };