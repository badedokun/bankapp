#!/usr/bin/env node

/**
 * Test Transaction Details Feature
 * Quick integration test for the new transaction details functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Transaction Details Feature Implementation');
console.log('====================================================');

// Test 1: Check if files exist
console.log('\n📁 Test 1: File Structure Validation');
const requiredFiles = [
  'src/screens/transactions/TransactionDetailsScreen.tsx',
  'src/screens/index.ts',
  'src/navigation/WebNavigator.tsx',
  'src/services/api.ts'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - EXISTS`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Test 2: Check TypeScript compilation
console.log('\n🔍 Test 2: TypeScript Compilation Check');
try {
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed:');
  console.log(error.stdout?.toString() || error.stderr?.toString() || error.message);
}

// Test 3: Check imports and exports
console.log('\n🔗 Test 3: Import/Export Validation');

try {
  // Check if TransactionDetailsScreen is properly exported
  const indexContent = fs.readFileSync(path.join(__dirname, 'src/screens/index.ts'), 'utf8');
  if (indexContent.includes('TransactionDetailsScreen')) {
    console.log('✅ TransactionDetailsScreen exported from screens/index.ts');
  } else {
    console.log('❌ TransactionDetailsScreen not exported from screens/index.ts');
  }

  // Check if navigation is updated
  const navContent = fs.readFileSync(path.join(__dirname, 'src/navigation/WebNavigator.tsx'), 'utf8');
  if (navContent.includes('TransactionDetails') && navContent.includes('onNavigateToTransactionDetails')) {
    console.log('✅ Navigation properly updated with TransactionDetails support');
  } else {
    console.log('❌ Navigation missing TransactionDetails support');
  }

  // Check if API service has getTransactionDetails
  const apiContent = fs.readFileSync(path.join(__dirname, 'src/services/api.ts'), 'utf8');
  if (apiContent.includes('getTransactionDetails')) {
    console.log('✅ API service has getTransactionDetails method');
  } else {
    console.log('❌ API service missing getTransactionDetails method');
  }

  // Check if Dashboard has transaction click handler
  const dashboardContent = fs.readFileSync(path.join(__dirname, 'src/screens/dashboard/DashboardScreen.tsx'), 'utf8');
  if (dashboardContent.includes('onNavigateToTransactionDetails') && dashboardContent.includes('TouchableOpacity')) {
    console.log('✅ Dashboard has clickable transaction items');
  } else {
    console.log('❌ Dashboard missing clickable transaction items');
  }

} catch (error) {
  console.log('❌ File reading error:', error.message);
}

// Test 4: Feature completeness check
console.log('\n🎯 Test 4: Feature Completeness');

const transactionDetailsPath = path.join(__dirname, 'src/screens/transactions/TransactionDetailsScreen.tsx');
if (fs.existsSync(transactionDetailsPath)) {
  const content = fs.readFileSync(transactionDetailsPath, 'utf8');

  const features = [
    { name: 'TransactionDetails interface', check: content.includes('interface TransactionDetails') },
    { name: 'Status display', check: content.includes('getStatusColor') && content.includes('getStatusIcon') },
    { name: 'Share functionality', check: content.includes('handleShare') },
    { name: 'Download receipt', check: content.includes('handleDownload') },
    { name: 'Report issue', check: content.includes('handleReportIssue') },
    { name: 'Retry transaction', check: content.includes('handleRetry') },
    { name: 'Amount formatting', check: content.includes('toLocaleString') },
    { name: 'Date formatting', check: content.includes('formatDateTime') },
    { name: 'Loading state', check: content.includes('isLoading') },
    { name: 'Error handling', check: content.includes('showAlert') },
  ];

  features.forEach(feature => {
    if (feature.check) {
      console.log(`✅ ${feature.name}`);
    } else {
      console.log(`❌ ${feature.name}`);
    }
  });
}

// Test 5: Git status
console.log('\n📊 Test 5: Git Status');
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  const modifiedFiles = gitStatus.split('\n').filter(line => line.trim()).length;
  console.log(`📝 ${modifiedFiles} files modified/added`);

  // Show the files
  if (gitStatus.trim()) {
    console.log('Modified files:');
    gitStatus.split('\n').filter(line => line.trim()).forEach(line => {
      console.log(`   ${line}`);
    });
  }
} catch (error) {
  console.log('❌ Git status check failed:', error.message);
}

console.log('\n🎉 Transaction Details Feature Test Complete!');
console.log('==============================================');

if (allFilesExist) {
  console.log('✅ All required files are present');
  console.log('🚀 Feature is ready for testing in the application');
} else {
  console.log('❌ Some files are missing - check implementation');
}

console.log('\n💡 Next Steps:');
console.log('1. Run the app: npm run dev');
console.log('2. Navigate to transaction history');
console.log('3. Click on any transaction to see details');
console.log('4. Test all the action buttons (share, download, report)');