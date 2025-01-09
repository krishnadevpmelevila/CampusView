const ExcelJS = require('exceljs');

async function processExcel(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];

    // Extract data
    const data = [];
    sheet.eachRow((row, rowIndex) => {
        if (rowIndex > 5) { // Skip header rows (adjust as needed)
            const rowData = {
                rollNo: row.getCell(1).value,
                name: row.getCell(2).value,
                scores: row.values.slice(3, -1), // Scores
                grade: row.getCell(row.values.length).value // Grade
            };
            data.push(rowData);
        }
    });

    return data;
}

module.exports = processExcel;
