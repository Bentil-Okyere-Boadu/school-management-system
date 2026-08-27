# Payments

**Who can use this:** School Admin, Student, Parent, Super Admin  
**Where:** School Admin → Payments & Finance; Student → My Payments; Parent → Family Dashboard → Finance tab; Super Admin → Schools → Hubtel Merchant tab

## Overview

Payments lets schools collect fees through mobile money. School admins track transactions and view finance summaries. Students see USSD payment instructions and transaction history. Parents pay fees for their wards. Super admins configure payment provider credentials per school.

## School Admin

| Action | Result |
|--------|--------|
| Open **Payments & Finance** before payment setup is complete and submit the payment setup request form. | A success or error message appears. If setup was already requested, a success state is shown. |
| On the **All payments** tab, search, filter by status or date, or clear filters. | The transaction table and result count update. |
| Click the view icon on a transaction. | A payment detail drawer opens. |
| Open a receipt for a paid transaction. | You navigate to the full receipt page. |
| On the **Finance** tab, toggle between **By student** and **By class**. | Different summary cards and tables display. You can search, filter by class or balance, and open a student’s finance detail drawer. |
| Click a class row in class view. | The view switches to student view filtered by that class. |

## Student

| Action | Result |
|--------|--------|
| Open **My Payments** and view USSD payment instructions. | Short code, merchant ID, and related details appear with copy buttons. |
| Search or filter your transaction history. | The paginated list updates. |
| View a transaction detail or open a receipt. | A detail drawer opens, or you navigate to the full receipt page. Closing the receipt returns to **My Payments**. |
| Try to pay when the school has paused payments. | A banner indicates payments are disabled and instructions are greyed out. |

## Parent

| Action | Result |
|--------|--------|
| On **Family Dashboard**, open the **Finance** tab or click **Pay fees** in the header. | You see balances and transaction history for the selected ward. If any balance is outstanding, a pay drawer opens. |
| In the pay drawer, select child(ren), enter amounts, provide a mobile money number and network, then proceed. | You move to an OTP verification step. |
| Enter the OTP and complete payment. | A status step confirms the outcome. Finance data refreshes on success. |
| Open a receipt from the finance tab. | You navigate to the receipt page for that transaction. |

## Super Admin

| Action | Result |
|--------|--------|
| Open a school’s detail page, go to the **Hubtel Merchant** tab, enter merchant credentials, and save. | Payment configuration is saved for that school. |
| Remove the merchant configuration. | The school’s payment setup is cleared. |

## Empty, error, and blocked states

- School Admin payments tab shows a loading spinner while configuration loads.
- An amber banner appears when payments are paused for the school.
- “No payment transactions match your filters” when the filtered list is empty.
- Finance tab shows “No students match your filters” or “No classes found” when applicable.
