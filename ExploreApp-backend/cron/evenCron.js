import cron from "node-cron";
import { fetchEventsFromAPI } from "../services/eventServices";

export const startCron = () => {
  cron.schedule("0 */6 * * *", async () => {
    console.log("Running Event Sync...");
    await fetchEventsFromAPI();
  });
};