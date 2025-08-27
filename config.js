// Google Sheets API Configuration
function getGoogleSheetsConfig() {
    // Get configuration from environment variables or use defaults
    const config = {
        apiKey: getEnvironmentVariable('GOOGLE_SHEETS_API_KEY', ''),
        spreadsheetId: getEnvironmentVariable('GOOGLE_SHEETS_SPREADSHEET_ID', ''),
        range: getEnvironmentVariable('GOOGLE_SHEETS_RANGE', 'Militares!A:G')
    };
    
    // Validate configuration
    if (!config.apiKey) {
        console.warn('Google Sheets API Key not found. Please set GOOGLE_SHEETS_API_KEY environment variable.');
    }
    
    if (!config.spreadsheetId) {
        console.warn('Google Sheets Spreadsheet ID not found. Please set GOOGLE_SHEETS_SPREADSHEET_ID environment variable.');
    }
    
    return config;
}

// Helper function to get environment variables
function getEnvironmentVariable(name, defaultValue = '') {
    // For GitHub Pages, we'll use a different approach since there's no server-side environment
    // The variables should be set in the GitHub repository secrets and injected during build
    
    // Check for window object with injected variables
    if (typeof window !== 'undefined' && window.CONFIG) {
        return window.CONFIG[name] || defaultValue;
    }
    
    // Fallback to check for global variables
    if (typeof window !== 'undefined' && window[name]) {
        return window[name];
    }
    
    // For development, you can temporarily set values here
    // DO NOT commit real API keys to the repository
    const developmentConfig = {
        'GOOGLE_SHEETS_API_KEY': '',
        'GOOGLE_SHEETS_SPREADSHEET_ID': '',
        'GOOGLE_SHEETS_RANGE': 'Militares!A:G'
    };
    
    return developmentConfig[name] || defaultValue;
}

// Application configuration
const APP_CONFIG = {
    name: 'Sistema de Cadastro Militar',
    version: '1.0.0',
    author: 'Desenvolvido para Registro de Pessoal Militar',
    
    // Form validation settings
    validation: {
        nameMaxLength: 100,
        battalionMaxLength: 100,
        addressMaxLength: 500,
        coordinateDecimalPlaces: 8
    },
    
    // Geolocation settings
    geolocation: {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    },
    
    // Google Sheets settings
    googleSheets: {
        retryAttempts: 3,
        retryDelay: 1000,
        timeout: 30000
    },
    
    // Military ranks in order of hierarchy
    militaryRanks: [
        { value: 'SD', label: 'Soldado (SD)', category: 'enlisted' },
        { value: 'CB', label: 'Cabo (CB)', category: 'enlisted' },
        { value: 'SGT', label: 'Sargento (SGT)', category: 'nco' },
        { value: 'SUB TEN', label: 'Subtenente (SUB TEN)', category: 'nco' },
        { value: 'TEN', label: 'Tenente (TEN)', category: 'officer' },
        { value: 'CAP', label: 'Capitão (CAP)', category: 'officer' },
        { value: 'MAJ', label: 'Major (MAJ)', category: 'officer' },
        { value: 'TEN CEL', label: 'Tenente Coronel (TEN CEL)', category: 'senior_officer' },
        { value: 'CEL', label: 'Coronel (CEL)', category: 'senior_officer' }
    ]
};

// Utility functions
const Utils = {
    // Format Brazilian military ranks
    formatRank: function(rank) {
        const rankInfo = APP_CONFIG.militaryRanks.find(r => r.value === rank);
        return rankInfo ? rankInfo.label : rank;
    },
    
    // Validate coordinates
    validateCoordinates: function(lat, lng) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        
        return {
            isValid: !isNaN(latitude) && !isNaN(longitude) && 
                    latitude >= -90 && latitude <= 90 && 
                    longitude >= -180 && longitude <= 180,
            latitude: latitude,
            longitude: longitude
        };
    },
    
    // Format date for Brazilian locale
    formatDate: function(date) {
        return new Date(date).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Generate unique ID for records
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getGoogleSheetsConfig,
        getEnvironmentVariable,
        APP_CONFIG,
        Utils
    };
}

// Log configuration status
console.log('Configuration loaded:', {
    appName: APP_CONFIG.name,
    version: APP_CONFIG.version,
    hasApiKey: !!getGoogleSheetsConfig().apiKey,
    hasSpreadsheetId: !!getGoogleSheetsConfig().spreadsheetId
});