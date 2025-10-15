#!/bin/bash

# Script to fix theme.colors references in static StyleSheets
# Converts: const styles = StyleSheet.create({ ... })
# To: const createStyles = (theme: any) => StyleSheet.create({ ... })
# And adds: const styles = createStyles(themeVar.theme || themeVar || theme);

files=(
  "/Users/bisiadedokun/bankapp/src/screens/loans/PersonalLoanScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/loans/ModernLoansMenuScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/settings/SettingsScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/ModernAIChatScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/savings/FlexibleSavingsScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/savings/ModernSavingsMenuScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/security/PCIDSSComplianceScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/security/CBNComplianceScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/security/SecurityMonitoringScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/auth/RegistrationScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/auth/LoginScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/referrals/ReferralScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/rewards/RewardsScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/admin/ReferralAdminDashboard.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/admin/ModernRBACManagementScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/transfers/CompleteTransferFlow.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/transfers/CompleteTransferFlowScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/transfers/ModernTransferMenuScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/transfers/ExternalTransferScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/dashboard/ModernDashboardScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/transactions/TransactionDetailsScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/bills/BillPaymentScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/history/TransactionHistoryScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/promo/PromoCodesScreen.tsx"
  "/Users/bisiadedokun/bankapp/src/screens/analytics/TransactionAnalyticsScreen.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"

    # Step 1: Change "const styles = StyleSheet.create({" to "const createStyles = (theme: any) => StyleSheet.create({"
    sed -i.bak 's/^const styles = StyleSheet\.create({$/const createStyles = (theme: any) => StyleSheet.create({/' "$file"

    # Step 2: Find the line with useTenantTheme and add styles creation after it
    # This is more complex - we need to find the pattern and add a line after it
    awk '
      /const.*=.*useTenantTheme\(\)/ {
        print $0
        # Extract the variable name from the pattern "const VAR = useTenantTheme()"
        match($0, /const ([a-zA-Z_][a-zA-Z0-9_]*) = useTenantTheme/, arr)
        varname = arr[1]
        if (varname != "") {
          print "  const styles = createStyles(" varname ".theme || " varname ");"
        }
        next
      }
      { print }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"

    echo "✓ Fixed: $file"
  else
    echo "✗ Not found: $file"
  fi
done

echo ""
echo "All files processed!"
