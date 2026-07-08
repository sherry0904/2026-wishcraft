import { writeFileSync } from 'fs';

const sheetId = '1prvIOMXTWExptg7uoZuUt2mYI7HaS0siypZAn7vprl4';
const tabs = ['Quests', 'Gifts', 'ShopItems', 'Milestones', 'QuestLogs', 'Config', 'PushSubscriptions'];

async function fetchTab(tab) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${tab}`;
  const res = await fetch(url);
  const text = await res.text();
  writeFileSync(`${tab}.csv`, text);
  console.log(`Fetched ${tab}: ${text.split('\n').length} lines`);
}

async function main() {
  for (const tab of tabs) {
    await fetchTab(tab);
  }
}
main();
