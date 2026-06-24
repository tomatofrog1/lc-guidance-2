import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const dir = path.join(__dirname, 'test_sheets');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  // Helper to generate a sheet header and format it
  function setupSheet(workbook, name) {
    const sheet = workbook.addWorksheet(name);
    
    // Set headers
    sheet.getRow(1).values = [
      'First Name', 'Last Name', 'Middle Name', 'Grade Level', 'Section',
      'Incident Date', 'Date Filed', 'Adviser', 'Case Type', 'Description',
      'Sanction', 'Progress', 'Proofs'
    ];
    
    // Style headers
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF002F87' }
    };
    
    // Adjust column widths
    const widths = [18, 18, 18, 16, 16, 16, 22, 22, 28, 42, 28, 18, 48];
    widths.forEach((w, i) => {
      sheet.getColumn(i + 1).width = w;
    });

    return sheet;
  }

  // 1. Wrong Format (Incorrect Headers)
  {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Cases');
    sheet.addRow(['ID', 'Student Name', 'Date', 'Case Type', 'Description']);
    sheet.addRow([1, 'Jane Smith', '2026-06-21', 'Truancy', 'Skipped class.']);
    await workbook.xlsx.writeFile(path.join(dir, 'wrong_format.xlsx'));
    console.log('Generated wrong_format.xlsx');
  }

  // 2. Missing/Invalid Fields
  {
    const workbook = new ExcelJS.Workbook();
    const sheet = setupSheet(workbook, 'Cases');

    // Row 1: Missing First Name (First Name is empty)
    sheet.addRow([
      '', 'Smith', 'A', 'Grade 11', 'STEM',
      '2026-06-21', '2026-06-21', 'Mrs. Cruz', 'Truancy', 'Skipped class.',
      'Detention', 'Resolved', '[]'
    ]);
    
    // Row 2: Missing Case Type (Case Type is empty)
    sheet.addRow([
      'John', 'Doe', 'M', 'Grade 10', 'A',
      '2026-06-24', '2026-06-24', 'Mr. Santos', '', 'Disruption in hallway',
      'Warning', 'Pending', '[]'
    ]);

    // Row 3: Invalid Date Filed and Incident Date format
    sheet.addRow([
      'Bob', 'Jones', 'K', 'Grade 9', 'B',
      'invalid-date', 'not-a-date', 'Mr. Santos', 'Academic', 'Failing grades',
      'Counseling', 'Pending', '[]'
    ]);

    // Row 4: Invalid JSON in Proofs
    sheet.addRow([
      'Alice', 'Green', 'L', 'Grade 12', 'HUMSS',
      '2026-06-23', '2026-06-23', 'Mrs. Lopez', 'Late', 'Arrived 30 mins late',
      'Warning', 'Resolved', '{invalid: json}'
    ]);

    await workbook.xlsx.writeFile(path.join(dir, 'missing_fields.xlsx'));
    console.log('Generated missing_fields.xlsx');
  }

  // 3. Valid Import
  {
    const workbook = new ExcelJS.Workbook();
    const sheet = setupSheet(workbook, 'Cases');

    sheet.addRow([
      'Jane', 'Smith', 'A', 'Grade 11', 'STEM',
      '2026-06-21', '2026-06-21', 'Mrs. Cruz', 'Truancy', 'Skipped class.',
      'Detention', 'Resolved', '[]'
    ]);
    sheet.addRow([
      'Alice\nCharlie', 'Brown\nDavis', 'B\nD', 'Grade 10', 'A',
      '2026-06-24', '2026-06-24', 'Mr. Santos', 'Academic problems', 'Group study issues',
      'Meeting', 'Pending', '[]'
    ]);
    await workbook.xlsx.writeFile(path.join(dir, 'valid_import.xlsx'));
    console.log('Generated valid_import.xlsx');
  }

  // 4. Duplicate Records (Testing identical records in the file)
  {
    const workbook = new ExcelJS.Workbook();
    const sheet = setupSheet(workbook, 'Cases');

    // Row 1: Case A
    sheet.addRow([
      'John', 'Doe', 'M', 'Grade 10', 'A',
      '2026-06-24', '2026-06-24', 'Mr. Santos', 'Bullying', 'Disruption in hallway',
      'Warning', 'Pending', '[]'
    ]);

    // Row 2: Exact duplicate of Row 1
    sheet.addRow([
      'John', 'Doe', 'M', 'Grade 10', 'A',
      '2026-06-24', '2026-06-24', 'Mr. Santos', 'Bullying', 'Disruption in hallway',
      'Warning', 'Pending', '[]'
    ]);

    // Row 3: Case B
    sheet.addRow([
      'Jane', 'Smith', 'A', 'Grade 11', 'STEM',
      '2026-06-21', '2026-06-21', 'Mrs. Cruz', 'Truancy', 'Skipped class.',
      'Detention', 'Resolved', '[]'
    ]);

    // Row 4: Exact duplicate of Row 3
    sheet.addRow([
      'Jane', 'Smith', 'A', 'Grade 11', 'STEM',
      '2026-06-21', '2026-06-21', 'Mrs. Cruz', 'Truancy', 'Skipped class.',
      'Detention', 'Resolved', '[]'
    ]);

    await workbook.xlsx.writeFile(path.join(dir, 'duplicate_records.xlsx'));
    console.log('Generated duplicate_records.xlsx');
  }

  console.log('All test sheets generated in "test_sheets" directory!');
}

main().catch(console.error);
