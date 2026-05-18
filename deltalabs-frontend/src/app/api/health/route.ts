/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { NextResponse } from "next/server";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
/** ################################ /COMPONENT ############################# */
