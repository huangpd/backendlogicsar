import { google } from "googleapis";
import keys from "../carryon-392712-4ac84298d1b2.json" assert { type: "json" };
import dotenv from "dotenv";

dotenv.config();

const client = new google.auth.JWT(keys.client_email, null, keys.private_key, [
  "https://www.googleapis.com/auth/spreadsheets",
]);

async function grabarEnExcel(data) {
  client.authorize(function (err, tokens) {
    if (err) {
      console.log(err);
      return;
    } else {
      console.log("Connected!");
      gsrun(client, data);
    }
  });
}

async function gsrun(cl, data) {
  const gsapi = google.sheets({ version: "v4", auth: cl });

  // Define the spreadsheet and range to read from.
  let readOptions = {
    spreadsheetId: process.env.URL_FACTURA,
    range: "Sheet1!B:B", // read all data in column B
  };

  // Read the data from the spreadsheet.
  let response = await gsapi.spreadsheets.values.get(readOptions);
  let rows = response.data.values;

  // Calculate the next row to write to.
  // If there are no rows yet, start with the first.
  let nextRow = rows ? rows.length + 1 : 1;

  // Define the spreadsheet and range to write to.
  let writeOptions = {
    spreadsheetId: process.env.URL_FACTURA,
    range: `Sheet1!B${nextRow}`, // write to the next row in column B
    valueInputOption: "USER_ENTERED",
    resource: { values: [[data.numero]] },
  };

  // Write the data to the spreadsheet.
  let res = await gsapi.spreadsheets.values.update(writeOptions);
}

export { grabarEnExcel };
