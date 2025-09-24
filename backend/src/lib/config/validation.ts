/**
 * Configuration validation utility for Sophia backend
 */

export interface ConfigValidation {
  isValid: boolean;
  missingVars: string[];
  warnings: string[];
}

export interface ServiceConfig {
  name: string;
  required: string[];
  optional?: string[];
}

// Define service configurations
export const SERVICE_CONFIGS: ServiceConfig[] = [
  {
    name: "PostgreSQL Database",
    required: ["DATABASE_URL"]
  },
  {
    name: "Azure OpenAI",
    required: [
      "AZURE_OPENAI_API_KEY",
      "AZURE_OPENAI_API_INSTANCE_NAME", 
      "AZURE_OPENAI_API_VERSION",
      "AZURE_OPENAI_API_GPT_DEPLOYMENT_NAME",
      "AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME"
    ]
  },
  {
    name: "Azure Search (Vector Storage)",
    required: [
      "AZURE_SEARCH_ENDPOINT",
      "AZURE_SEARCH_INDEX_NAME", 
      "AZURE_SEARCH_API_KEY"
    ]
  },
  {
    name: "Azure Blob Storage",
    required: [
      "AZURE_STORAGE_CONNECTION_STRING",
      "AZURE_BLOB_CONTAINER_NAME"
    ]
  },
  {
    name: "Neo4j Database",
    required: [
      "NEO4J_URI",
      "NEO4J_USER",
      "NEO4J_PASSWORD"
    ]
  }
];

/**
 * Validate configuration for a specific service
 */
export function validateServiceConfig(serviceConfig: ServiceConfig): ConfigValidation {
  const missingVars = serviceConfig.required.filter(envVar => !process.env[envVar]);
  
  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings: []
  };
}

/**
 * Validate all service configurations
 */
export function validateAllConfigs(): Record<string, ConfigValidation> {
  const results: Record<string, ConfigValidation> = {};
  
  for (const serviceConfig of SERVICE_CONFIGS) {
    results[serviceConfig.name] = validateServiceConfig(serviceConfig);
  }
  
  return results;
}

/**
 * Check if training can be performed (requires Azure OpenAI, Azure Search, Neo4j)
 */
export function canPerformTraining(): ConfigValidation {
  const trainingServices = SERVICE_CONFIGS.filter(config => 
    config.name === "Azure OpenAI" || 
    config.name === "Azure Search (Vector Storage)" || 
    config.name === "Neo4j Database"
  );
  
  const allMissingVars: string[] = [];
  
  for (const serviceConfig of trainingServices) {
    const validation = validateServiceConfig(serviceConfig);
    allMissingVars.push(...validation.missingVars);
  }
  
  return {
    isValid: allMissingVars.length === 0,
    missingVars: allMissingVars,
    warnings: []
  };
}

/**
 * Check if file upload can be performed (requires Azure Blob Storage)
 */
export function canPerformFileUpload(): ConfigValidation {
  const uploadService = SERVICE_CONFIGS.find(config => config.name === "Azure Blob Storage");
  return uploadService ? validateServiceConfig(uploadService) : {
    isValid: false,
    missingVars: [],
    warnings: ["Upload service configuration not found"]
  };
}

/**
 * Print configuration status to console
 */
export function printConfigStatus(): void {
  console.log("\n=== Sophia Configuration Status ===");
  
  const results = validateAllConfigs();
  
  for (const [serviceName, validation] of Object.entries(results)) {
    const status = validation.isValid ? "✓ READY" : "✗ NOT CONFIGURED";
    console.log(`${status} - ${serviceName}`);
    
    if (!validation.isValid) {
      console.log(`  Missing: ${validation.missingVars.join(", ")}`);
    }
  }
  
  const trainingStatus = canPerformTraining();
  console.log(`\nTraining: ${trainingStatus.isValid ? "✓ ENABLED" : "✗ DISABLED"}`);
  
  const uploadStatus = canPerformFileUpload();
  console.log(`File Upload: ${uploadStatus.isValid ? "✓ ENABLED" : "✗ DISABLED"}`);
  
  console.log("\n================================\n");
}