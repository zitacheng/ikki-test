const fs = require("fs");
const ReadLines = require("n-readlines");
const { stringify } = require("csv-stringify");
const writableStream = fs.createWriteStream("info.csv");
const columns = [];
const headerName = [];
const regex = /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
let row, value, idx, line, final;

function changeDate(theDate) {
  const date = new Date(theDate);
  const day = ("0" + date.getUTCDate()).slice(-2); // Ensures two digits with leading zero if needed
  const month = ("0" + (date.getUTCMonth() + 1)).slice(-2); // Month is zero-based, so add 1
  const year = date.getUTCFullYear();

  return `${day}-${month}-${year}`;
}

function setColData(row, type, final) {
  switch (type) {
    case "date":
      //check if there is a date and change the format
      if (!regex.test(final)) {
        console.log(
          "Error date, the given date form doesn't match for xxxx-xx-xx ",
          final
        );
        process.exit(1);
      }
      row.push(changeDate(final));
      break;
    case "chaîne":
      //check if there is a date and change the format
      row.push('"' + final + '"');
      break;
    case "numérique":
      //check if there is a date and change the format
      if (isNaN(Number(final))) {
        console.log(
          "Error NaN, the given data for number colomn is not a number but: ",
          final
        );
        process.exit(1);
      }
      row.push(Number(final));
      break;
    default:
      row.push(final);
  }
}

function initVal() {
  row = [];
  value = "";
  final = "";
}

function openParseFile(stringifier) {
  //Try to open the parse file
  try {
    const readLines = new ReadLines(process.argv[2]);
    //Read each line
    while ((line = readLines.next())) {
      line = line.toString("ascii").trim();
      if (line.length > 0) {
        initVal();
        //Get each columns value
        columns.forEach((col) => {
          idx = line.indexOf(
            " ",
            line[value.length] == " " ? value.length + 1 : value.length
          );
          //define until which character it should cut the line
          if (idx < 0 || idx > value.length + Number(col.max))
            idx = value.length + Number(col.max);
          else idx += 1;
          final = line.slice(value.length, idx).trim();
          setColData(row, col.type, final);
          value += line.slice(value.length, idx);
        });
        stringifier.write(row);
      }
    }
    stringifier.pipe(writableStream);
    console.log("Finished writing data");
  } catch (err) {
    console.error(err);
  }
}

function getMetadata() {
  //Try to open the metadata file
  try {
    let array = [];
    const data = fs.readFileSync(process.argv[3], "utf-8");
    data.split(/\r?\n/).forEach((line, id) => {
      array = line.split(",");
      if (array.length != 3)
      {
        console.log("Error: the metada file form is incorrect, example: name, length, type");
        process.exit(1);
      }
      else if (array[2] != 'date' && array[2] != 'numérique' && array[2] != 'chaîne' )
      {
        console.log("Error: the type of metadata is incorrect should, the differrents type are : date, numérique and chaîne");
        process.exit(1);
      }
      //set metadata informations into columns
      columns.push({ title: array[0], max: array[1], type: array[2]});
      // Push the columns name into header
      headerName.push(array[0].trim());
    });
    //Set header name in scv
    const stringifier = stringify({ header: true, columns: headerName });
    openParseFile(stringifier);
  } catch (err) {
    console.error(err);
  }
}

//Check it has the file to parse and the metada in arguments
if (process.argv.length < 4) {
  console.log("Usage: node index.js testA/file testA/metada");
  process.exit(1);
}

getMetadata();
