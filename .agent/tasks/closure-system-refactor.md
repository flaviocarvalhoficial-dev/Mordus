# Task: Closure System Refactor

## Objective
Refactor the "Fechamento Mensal" (Monthly Closure) system to allow selecting previous months, calculate initial/starting balances (carry-over), and ensuring no transactions are left unclosed.

## Requirements
1. **Month/Year Selection**: Allow users to pick which month they want to close.
2. **Saldo Anterior (Initial Balance)**: Automatically fetch the `final_balance` of the most recent closure as the `initial_balance` for the new one.
3. **Pending Transactions**: The default month for closure should be the first one with unclosed transactions.
4. **Persistence**: Save `initial_balance` and update `final_balance` calculation in the `monthly_closures` table.

## Technical Plan
1. **UI Changes**:
    - Add Month/Year selector in `Closures.tsx`.
    - Update the "Período Atual" card to show "Saldo Inicial".
2. **Logic Changes**:
    - Update `fetchCurrentMonthStats` to handle variable periods.
    - Implement `fetchInitialBalance` function to query the previous closure.
    - Update `handleClosePeriod` to insert `initial_balance` and calculate true `final_balance`.
3. **Database Integration**:
    - Use Supabase `.order("end_date", { descending: true }).limit(1)` to find the last closure.

## Success Criteria
- User can select a previous month and see its stats.
- The "Saldo Inicial" matches the "Saldo Final" of the previously closed month.
- Closing a month correctly handles the carry-over balance.
