/**
 * Carbon Footprint Calculator - Frontend JavaScript
 * Handles AJAX requests, dynamic updates, and Chart.js visualizations
 */

// ========== FORM SUBMISSION ==========
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('carbonForm');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const formData = {
                product_name: document.getElementById('productName').value,
                material: document.getElementById('material').value,
                weight_kg: parseFloat(document.getElementById('weight').value),
                transport_mode: document.getElementById('transportMode').value,
                transport_distance_km: parseFloat(document.getElementById('distance').value),
                manufacturing_intensity: 'MEDIUM'
            };
            
            // Validate
            if (!formData.material || !formData.transport_mode) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Show loading state
            document.getElementById('loadingState').classList.remove('hidden');
            form.style.opacity = '0.5';
            form.style.pointerEvents = 'none';
            
            try {
                // Make API request
                const response = await fetch('/api/predict/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Store results in sessionStorage
                    sessionStorage.setItem('carbonResults', JSON.stringify(result));
                    
                    // Redirect to results page
                    window.location.href = '/results/';
                } else {
                    alert('Error: ' + result.error);
                    document.getElementById('loadingState').classList.add('hidden');
                    form.style.opacity = '1';
                    form.style.pointerEvents = 'auto';
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Network error. Please try again.');
                document.getElementById('loadingState').classList.add('hidden');
                form.style.opacity = '1';
                form.style.pointerEvents = 'auto';
            }
        });
    }
});

// ========== RESULTS DISPLAY ==========
function displayResults(data) {
    // Hide empty state, show results
    const emptyState = document.getElementById('emptyState');
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (emptyState) emptyState.classList.add('hidden');
    if (resultsContainer) resultsContainer.classList.remove('hidden');
    
    // Animate CO2 value
    const co2Element = document.getElementById('co2Value');
    if (co2Element) {
        animateValue(co2Element, 0, data.co2_kg, 2000, ' kg');
    }
    
    // Equivalency text
    const equivalencyElement = document.getElementById('equivalencyText');
    if (equivalencyElement) {
        equivalencyElement.textContent = `≈ ${data.equivalency.display}`;
    }
    
    // Update total emissions in detailed analysis
    const totalEmissions = document.getElementById('totalEmissions');
    if (totalEmissions) {
        setTimeout(() => {
            totalEmissions.textContent = `${data.co2_kg} kg CO₂e`;
        }, 500);
    }
    
    // Breakdown percentages
    updateBreakdown(data.breakdown);
    
    // Compensation data
    updateCompensation(data.compensation, data.equivalency);
    
    // Create donut chart
    createBreakdownChart(data.breakdown);
}

function updateBreakdown(breakdown) {
    // Update percentages
    const materialPercent = document.getElementById('materialPercent');
    const mfgPercent = document.getElementById('mfgPercent');
    const transportPercent = document.getElementById('transportPercent');
    
    if (materialPercent) materialPercent.textContent = `${breakdown.materials_percent}%`;
    if (mfgPercent) mfgPercent.textContent = `${breakdown.manufacturing_percent}%`;
    if (transportPercent) transportPercent.textContent = `${breakdown.transport_percent}%`;
    
    // Animate progress bars
    setTimeout(() => {
        const materialBar = document.getElementById('materialBar');
        const mfgBar = document.getElementById('mfgBar');
        const transportBar = document.getElementById('transportBar');
        
        if (materialBar) materialBar.style.width = `${breakdown.materials_percent}%`;
        if (mfgBar) mfgBar.style.width = `${breakdown.manufacturing_percent}%`;
        if (transportBar) transportBar.style.width = `${breakdown.transport_percent}%`;
    }, 300);
}

function updateCompensation(compensation, equivalency) {
    // Stats cards at top
    const treesElement = document.getElementById('treesNeeded');
    const veganElement = document.getElementById('veganDays');
    const carElement = document.getElementById('carKm');
    
    if (treesElement) {
        animateValue(treesElement, 0, compensation.trees_display, 1500);
    }
    if (veganElement) {
        animateValue(veganElement, 0, compensation.days_vegan, 1500);
    }
    if (carElement) {
        animateValue(carElement, 0, equivalency.car_km, 1500);
    }
    
    // Compensation grid items
    const treesCompensation = document.getElementById('treesCompensation');
    const veganCompensation = document.getElementById('veganCompensation');
    const recycleCompensation = document.getElementById('recycleCompensation');
    
    if (treesCompensation) {
        setTimeout(() => {
            treesCompensation.textContent = compensation.trees_display;
        }, 800);
    }
    if (veganCompensation) {
        setTimeout(() => {
            veganCompensation.textContent = Math.round(compensation.days_vegan);
        }, 1000);
    }
    if (recycleCompensation) {
        setTimeout(() => {
            // Calculate recycling equivalent (rough estimate: 1kg recycled = 0.8kg CO2 saved)
            const recycleKg = Math.round(compensation.trees_display * 20 / 0.8);
            recycleCompensation.textContent = recycleKg;
        }, 1200);
    }
}

// ========== CHART CREATION ==========
function createBreakdownChart(breakdown) {
    const canvas = document.getElementById('breakdownChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Materials', 'Manufacturing', 'Transport'],
            datasets: [{
                data: [
                    breakdown.materials_percent,
                    breakdown.manufacturing_percent,
                    breakdown.transport_percent
                ],
                backgroundColor: [
                    'rgba(100, 255, 180, 0.9)',
                    'rgba(139, 92, 246, 0.9)',
                    'rgba(255, 140, 80, 0.9)'
                ],
                borderColor: [
                    'rgba(100, 255, 180, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(255, 140, 80, 1)'
                ],
                borderWidth: 3,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f5f5f5',
                        font: {
                            family: "'Inter', sans-serif",
                            size: 14,
                            weight: '500'
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 15, 30, 0.95)',
                    padding: 16,
                    titleFont: {
                        size: 15,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 14
                    },
                    borderColor: 'rgba(100, 255, 180, 0.3)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Animate number from start to end
 */
function animateValue(element, start, end, duration, suffix = '') {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        
        const displayValue = typeof end === 'number' && end % 1 !== 0 
            ? current.toFixed(2) 
            : Math.round(current);
        
        element.textContent = displayValue + suffix;
    }, 16);
}

/**
 * Get CSRF token from cookies
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Format large numbers with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Smooth scroll to element
 */
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ========== PAGE-SPECIFIC INITIALIZATIONS ==========

// Initialize results page if data exists
if (window.location.pathname === '/results/') {
    window.addEventListener('DOMContentLoaded', function() {
        const results = sessionStorage.getItem('carbonResults');
        if (results) {
            displayResults(JSON.parse(results));
        }
    });
}

// ========== SCROLL ANIMATIONS ==========

/**
 * Scroll Animation System
 * 1. Dynamically adds scroll classes to elements
 * 2. Creates Intersection Observer to watch for viewport entry
 * 3. Immediately shows elements already in viewport on load
 */
document.addEventListener('DOMContentLoaded', function() {

    // --- STEP 1: Add scroll animation classes dynamically ---
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        if (!card.classList.contains('scroll-scale')) {
            card.classList.add('scroll-scale');
            card.style.transitionDelay = `${index * 0.1}s`;
        }
    });

    const breakdownItems = document.querySelectorAll('.breakdown-item');
    breakdownItems.forEach((item, index) => {
        if (!item.classList.contains('scroll-slide-left')) {
            item.classList.add('scroll-slide-left');
            item.style.transitionDelay = `${index * 0.1}s`;
        }
    });

    const compensationItems = document.querySelectorAll('.compensation-item');
    compensationItems.forEach((item, index) => {
        if (!item.classList.contains('scroll-slide-right')) {
            item.classList.add('scroll-slide-right');
            item.style.transitionDelay = `${index * 0.1}s`;
        }
    });

    // --- STEP 2: Create the Intersection Observer ---
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.05
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                // Remove to allow re-animation on scroll back
                entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    // --- STEP 3: Observe ALL elements with scroll classes ---
    const allScrollElements = document.querySelectorAll(
        '.scroll-fade-in, .scroll-slide-left, .scroll-slide-right, .scroll-scale, .animate-on-scroll'
    );

    allScrollElements.forEach(element => {
        scrollObserver.observe(element);
    });

    // --- STEP 4: Re-animate existing CSS animation classes on scroll ---
    const reanimateObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                ['fade-in', 'slide-up', 'scale-up'].forEach(cls => {
                    if (el.classList.contains(cls)) {
                        el.classList.remove(cls);
                        void el.offsetWidth; // force reflow
                        el.classList.add(cls);
                    }
                });
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in, .slide-up, .scale-up').forEach(el => {
        reanimateObserver.observe(el);
    });
});
