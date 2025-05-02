import { processApiCall } from "@/apis/processApiCall";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Pass both req and res to processApiCall
    const response = await processApiCall(req, res);

    // processApiCall now handles setting cookies via `res`
    // It returns the CacheResult containing the data payload
    return res.status(200).json(response);

  } catch (error: any) {
    console.error("API Processing Error:", error);
    // Return a generic error response (don't expose internal details)
    // Ensure CacheResult structure is consistent if client expects it even for errors
    return res.status(200).json({
      data: { error: "An internal server error occurred." },
      isFromCache: false,
      metadata: undefined
    });
    // Or, if client handles non-CacheResult errors:
    // return res.status(500).json({ error: "An internal server error occurred." });
  }
}

export const config = {
  maxDuration: 60,
};
