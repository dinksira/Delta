/**
 * WalletPage
 * Page wrapper for the Wallet module. Auth is enforced by the `(app)`
 * layout (`requireAuthenticated`), so this stays a thin composition root.
 */

/** ################################ IMPORT ############################# */
/** Module view. */
import { WalletPageView } from "@/modules/Wallet";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export default function WalletPage() {
  return <WalletPageView />;
}
/** ################################ /COMPONENT ############################# */
