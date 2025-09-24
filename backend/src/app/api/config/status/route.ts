import { NextRequest, NextResponse } from "next/server";
import { validateAllConfigs, canPerformTraining, canPerformFileUpload } from "@/lib/config/validation";

export async function GET(req: NextRequest) {
  try {
    const allConfigs = validateAllConfigs();
    const trainingConfig = canPerformTraining();
    const uploadConfig = canPerformFileUpload();
    
    const summary = {
      overall: {
        allServicesReady: Object.values(allConfigs).every(config => config.isValid),
        trainingEnabled: trainingConfig.isValid,
        uploadEnabled: uploadConfig.isValid
      },
      services: allConfigs,
      capabilities: {
        training: {
          enabled: trainingConfig.isValid,
          missingConfig: trainingConfig.missingVars
        },
        fileUpload: {
          enabled: uploadConfig.isValid,
          missingConfig: uploadConfig.missingVars
        }
      }
    };
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error checking configuration:", error);
    return NextResponse.json(
      { error: "Failed to check configuration" },
      { status: 500 }
    );
  }
}