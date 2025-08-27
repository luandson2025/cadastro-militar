// Global variables
let isSubmitting = false;

// DOM elements
const form = document.getElementById('militaryForm');
const getLocationBtn = document.getElementById('getLocationBtn');
const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');
const loadingOverlay = document.getElementById('loadingOverlay');
const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');
const submitBtn = document.getElementById('submitBtn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
        getLocationBtn.style.display = 'none';
        console.log('Geolocation is not supported by this browser.');
    }
    
    // Add event listeners
    getLocationBtn.addEventListener('click', getCurrentLocation);
    form.addEventListener('submit', handleFormSubmit);
    
    // Modal event listeners
    document.getElementById('closeSuccessModal').addEventListener('click', closeSuccessModal);
    document.getElementById('closeErrorModal').addEventListener('click', closeErrorModal);
    
    // Close modals when clicking outside
    successModal.addEventListener('click', function(e) {
        if (e.target === successModal) {
            closeSuccessModal();
        }
    });
    
    errorModal.addEventListener('click', function(e) {
        if (e.target === errorModal) {
            closeErrorModal();
        }
    });
    
    // Form reset event
    form.addEventListener('reset', function() {
        setTimeout(() => {
            validateForm();
        }, 100);
    });
    
    // Real-time form validation
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', validateForm);
        input.addEventListener('blur', validateForm);
    });
    
    // Initial form validation
    validateForm();
    
    console.log('Military Registration System initialized');
}

// Get current location using Geolocation API
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocalização não é suportada por este navegador.');
        return;
    }
    
    // Disable button and show loading state
    getLocationBtn.disabled = true;
    getLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Obtendo localização...';
    
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
            // Update form fields
            latitudeInput.value = latitude.toFixed(8);
            longitudeInput.value = longitude.toFixed(8);
            
            // Reset button state
            getLocationBtn.disabled = false;
            getLocationBtn.innerHTML = '<i class="fas fa-check"></i> Localização obtida!';
            
            // Reset button text after 3 seconds
            setTimeout(() => {
                getLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Obter Localização Atual';
            }, 3000);
            
            // Validate form after location is obtained
            validateForm();
            
            console.log('Location obtained:', { latitude, longitude });
        },
        function(error) {
            let errorMsg = 'Erro ao obter localização: ';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += 'Permissão negada pelo usuário.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg += 'Informação de localização indisponível.';
                    break;
                case error.TIMEOUT:
                    errorMsg += 'Timeout na solicitação de localização.';
                    break;
                default:
                    errorMsg += 'Erro desconhecido.';
                    break;
            }
            
            showError(errorMsg);
            
            // Reset button state
            getLocationBtn.disabled = false;
            getLocationBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Obter Localização Atual';
            
            console.error('Geolocation error:', error);
        },
        options
    );
}

// Validate form
function validateForm() {
    const formData = new FormData(form);
    let isValid = true;
    
    // Check required fields
    const requiredFields = ['rank', 'name', 'battalion', 'address', 'latitude', 'longitude'];
    
    requiredFields.forEach(field => {
        const value = formData.get(field);
        if (!value || value.trim() === '') {
            isValid = false;
        }
    });
    
    // Validate coordinates
    const latitude = parseFloat(formData.get('latitude'));
    const longitude = parseFloat(formData.get('longitude'));
    
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        isValid = false;
    }
    
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        isValid = false;
    }
    
    // Update submit button state
    submitBtn.disabled = !isValid || isSubmitting;
    
    return isValid;
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (isSubmitting) {
        return;
    }
    
    if (!validateForm()) {
        showError('Por favor, preencha todos os campos obrigatórios corretamente.');
        return;
    }
    
    isSubmitting = true;
    showLoading();
    
    try {
        const formData = new FormData(form);
        const militaryData = {
            rank: formData.get('rank'),
            name: formData.get('name'),
            battalion: formData.get('battalion'),
            address: formData.get('address'),
            latitude: parseFloat(formData.get('latitude')),
            longitude: parseFloat(formData.get('longitude')),
            timestamp: new Date().toISOString()
        };
        
        console.log('Submitting military data:', militaryData);
        
        // Submit to Google Sheets
        await submitToGoogleSheets(militaryData);
        
        // Show success message
        hideLoading();
        showSuccess();
        
        // Reset form
        form.reset();
        validateForm();
        
    } catch (error) {
        console.error('Error submitting form:', error);
        hideLoading();
        showError(error.message || 'Erro ao cadastrar militar. Tente novamente.');
    } finally {
        isSubmitting = false;
    }
}

// Submit data to Google Sheets
async function submitToGoogleSheets(data) {
    try {
        // Get API configuration
        const config = getGoogleSheetsConfig();
        
        if (!config.apiKey || !config.spreadsheetId) {
            throw new Error('Configuração do Google Sheets não encontrada. Verifique as variáveis de ambiente.');
        }
        
        // Prepare data for Google Sheets
        const values = [
            [
                data.timestamp,
                data.rank,
                data.name,
                data.battalion,
                data.address,
                data.latitude,
                data.longitude
            ]
        ];
        
        const requestBody = {
            values: values
        };
        
        // Make API request
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${config.range}:append?valueInputOption=USER_ENTERED&key=${config.apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Erro na API: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Data successfully submitted to Google Sheets:', result);
        
        return result;
        
    } catch (error) {
        console.error('Google Sheets API error:', error);
        throw error;
    }
}

// Show loading overlay
function showLoading() {
    loadingOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Show success modal
function showSuccess() {
    successModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close success modal
function closeSuccessModal() {
    successModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Show error modal
function showError(message) {
    errorMessage.textContent = message;
    errorModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close error modal
function closeErrorModal() {
    errorModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Handle keyboard events for accessibility
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        if (successModal.style.display === 'flex') {
            closeSuccessModal();
        }
        if (errorModal.style.display === 'flex') {
            closeErrorModal();
        }
    }
});

// Form validation helpers
function validateLatitude(lat) {
    const latitude = parseFloat(lat);
    return !isNaN(latitude) && latitude >= -90 && latitude <= 90;
}

function validateLongitude(lng) {
    const longitude = parseFloat(lng);
    return !isNaN(longitude) && longitude >= -180 && longitude <= 180;
}

// Utility function to format coordinates
function formatCoordinate(coordinate, decimalPlaces = 8) {
    return parseFloat(coordinate).toFixed(decimalPlaces);
}

// Debug helper
function logFormData() {
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    console.log('Current form data:', data);
}