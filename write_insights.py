import os

content = r"""{% extends 'base.html' %}
{% load static %}

{% block title %}Model Insights{% endblock %}

{% block background_video %}
<video autoplay muted loop playsinline id="bgVideo">
    <source src="{% static 'videos/insight.mp4' %}" type="video/mp4">
</video>
{% endblock %}

{% block extra_css %}
<style>
/* ====== REVERT TO DARK THEME ====== */
.video-overlay {
    background: rgba(10, 25, 47, 0.8) !important;
    backdrop-filter: none !important;
}

.page-wrapper {
    --text-primary: #ffffff;
    --text-secondary: rgba(255, 255, 255, 0.85);
    --text-muted: rgba(255, 255, 255, 0.6);
    --card-bg: rgba(255, 255, 255, 0.05);
    --card-border: rgba(255, 255, 255, 0.1);
}

.page-wrapper h1, .page-wrapper h2, .page-wrapper h3, .page-wrapper h4 {
    color: var(--text-primary) !important;
}

.page-wrapper h1 {
    background: linear-gradient(135deg, #64ffb4, #00d9ff) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
}

.page-wrapper .glass-card {
    background: var(--card-bg) !important;
    border: 1px solid var(--card-border) !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
    backdrop-filter: blur(12px) !important;
}

.page-wrapper .glass-card:hover {
    border-color: rgba(100, 255, 180, 0.3) !important;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5) !important;
}

.page-wrapper p, .page-wrapper li, .page-wrapper small, .page-wrapper span:not(.metric-counter) {
    color: var(--text-secondary) !important;
}

/* Nav Revert */
.navbar {
    background: rgba(10, 25, 47, 0.8) !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}
.nav-links a { color: rgba(255, 255, 255, 0.7) !important; }
.nav-links a.active { color: #64ffb4 !important; }
.nav-links a:hover { color: #64ffb4 !important; background: rgba(100, 255, 180, 0.05); }

#particles-js {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
}

.metric-counter {
    font-size: 3rem; font-weight: 800; font-family: var(--font-heading);
    background: linear-gradient(135deg, #64ffb4, #00d9ff);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
}

.pipeline-step { background: rgba(255, 255, 255, 0.08) !important; }
.formula-card { background: rgba(255, 255, 255, 0.03) !important; }
.transport-card { background: rgba(255, 255, 255, 0.04) !important; }

.accuracy-ring-container { display: flex; justify-content: center; align-items: center; }
.accuracy-ring { position: relative; width: 180px; height: 180px; }
.accuracy-ring svg { transform: rotate(-90deg); }
.accuracy-ring-bg { fill: none; stroke: rgba(255, 255, 255, 0.1); stroke-width: 12; }
.accuracy-ring-fill { fill: none; stroke: url(#ringGrad); stroke-width: 12; stroke-linecap: round; transition: stroke-dashoffset 2s ease-out; }
.accuracy-ring-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
.accuracy-ring-value { font-size: 2.2rem; font-weight: 800; line-height: 1; }
.accuracy-ring-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }

/* ======== TAB STYLES (REQUIRED FOR CHARTS TO WORK) ======== */
.tab-container {
    width: 100%;
}
.tab-buttons {
    display: flex;
    gap: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 2rem;
}
.tab-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    padding: 0.8rem 1.2rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.3s ease;
}
.tab-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.05);
}
.tab-btn.active {
    color: #64ffb4;
    border-bottom-color: #64ffb4;
}
.tab-panel {
    display: none;
    animation: fadeIn 0.4s ease-out;
}
.tab-panel.active {
    display: block;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Chart containers */
.charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-top: 1.5rem;
}
.chart-wrapper {
    position: relative;
    height: 350px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 16px;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
}
.chart-wrapper h3 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.5) !important;
    margin-bottom: 0.5rem;
    text-align: center;
}
.chart-wrapper canvas {
    max-height: 300px;
}

@media (max-width: 768px) {
    .charts-grid { grid-template-columns: 1fr; }
    .chart-wrapper { height: 300px; }
    .tab-buttons { overflow-x: auto; padding-bottom: 1rem; }
}
</style>
{% endblock %}

{% block content %}
<div id="particles-js"></div>
<div class="container page-wrapper" style="position: relative; z-index: 2;">
    <div class="text-center mb-5 scroll-fade-in">
        <h1>Model Insights &amp; Methodology</h1>
        <p style="font-size: 1.25rem; max-width: 800px; margin: 1rem auto; opacity: 0.9;">
            Explore how our custom Random Forest model calculates carbon footprints
            using scientifically-grounded emission factors.
        </p>
        <div class="pipeline scroll-fade-in">
            <div class="pipeline-step"><span class="pipeline-step-icon">DATA</span><span class="pipeline-step-label">Data Input</span></div>
            <span class="pipeline-arrow">-&gt;</span>
            <div class="pipeline-step"><span class="pipeline-step-icon">ENG</span><span class="pipeline-step-label">Feature Eng.</span></div>
            <span class="pipeline-arrow">-&gt;</span>
            <div class="pipeline-step"><span class="pipeline-step-icon">RF</span><span class="pipeline-step-label">Random Forest</span></div>
            <span class="pipeline-arrow">-&gt;</span>
            <div class="pipeline-step"><span class="pipeline-step-icon">PRED</span><span class="pipeline-step-label">Prediction</span></div>
            <span class="pipeline-arrow">-&gt;</span>
            <div class="pipeline-step"><span class="pipeline-step-icon">OFF</span><span class="pipeline-step-label">Offset Plan</span></div>
        </div>
    </div>

    <div class="glass-card scroll-scale">
        <h2 style="color: #64ffb4 !important;">Model Performance</h2>
        {% if model_info %}
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: center; margin-top: 1rem;">
            <div class="accuracy-ring-container">
                <div class="accuracy-ring" id="accuracyRing">
                    <svg width="180" height="180" viewBox="0 0 180 180">
                        <defs><linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#64ffb4" /><stop offset="100%" style="stop-color:#00d9ff" /></linearGradient></defs>
                        <circle cx="90" cy="90" r="80" class="accuracy-ring-bg"/>
                        <circle cx="90" cy="90" r="80" class="accuracy-ring-fill" id="ringFill"/>
                    </svg>
                    <div class="accuracy-ring-text">
                        <div class="accuracy-ring-value" id="ringValue" style="color: #64ffb4 !important;">0</div>
                        <div class="accuracy-ring-label">R2 Score</div>
                    </div>
                </div>
            </div>
            <div>
                <div style="margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>RMSE</span>
                        <span class="metric-counter" style="font-size: 1.5rem;" data-target="{{ model_info.rmse|floatformat:2 }}">0</span>
                    </div>
                    <small style="opacity: 0.7;">Root Mean Squared Error (kg CO2e)</small>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>MAE</span>
                        <span class="metric-counter" style="font-size: 1.5rem;" data-target="{{ model_info.mae|floatformat:2 }}">0</span>
                    </div>
                    <small style="opacity: 0.7;">Mean Absolute Error (kg CO2e)</small>
                </div>
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Training Samples</span>
                        <span class="metric-counter" style="font-size: 1.5rem;" data-target="5000">0</span>
                    </div>
                    <small style="opacity: 0.7;">Synthetic dataset size</small>
                </div>
            </div>
        </div>
        {% else %}
        <p class="text-muted">Model information not available.</p>
        {% endif %}
    </div>

    <div class="glass-card mt-4 scroll-fade-in">
        <h2 style="color: #64ffb4 !important;">Calculation Methodology</h2>
        <p style="margin-top: 0.5rem; opacity: 0.8;">Click each section to expand the formula details.</p>
        <div class="formula-card" onclick="toggleFormula(this)">
            <div class="formula-header">
                <div class="formula-title"><span>1. Material Emissions</span></div>
                <span class="formula-toggle" style="color: #64ffb4 !important;">+</span>
            </div>
            <div class="formula-details">
                <div class="formula-code" style="color: #64ffb4 !important;">CO2 = Weight (kg) x Material Factor (kg CO2e/kg)</div>
                <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.7;">Based on IPCC 2006 Guidelines.</p>
            </div>
        </div>
        <div class="formula-card" onclick="toggleFormula(this)">
            <div class="formula-header">
                <div class="formula-title"><span>2. Manufacturing Emissions</span></div>
                <span class="formula-toggle" style="color: #64ffb4 !important;">+</span>
            </div>
            <div class="formula-details">
                <div class="formula-code" style="color: #64ffb4 !important;">CO2 = Weight x Intensity Factor x 1.4</div>
                <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.7;">Intensity: Low (0.5), Medium (1.5), High (3.5).</p>
            </div>
        </div>
        <div class="formula-card" onclick="toggleFormula(this)">
            <div class="formula-header">
                <div class="formula-title"><span>3. Transport Emissions</span></div>
                <span class="formula-toggle" style="color: #64ffb4 !important;">+</span>
            </div>
            <div class="formula-details">
                <div class="formula-code" style="color: #64ffb4 !important;">CO2 = Weight x (Distance / 1000) x Transport Factor</div>
                <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.7;">Standard logistical emission factors.</p>
            </div>
        </div>
    </div>

    <div class="glass-card mt-4 scroll-slide-left">
        <h2 style="color: #64ffb4 !important;">Emission Factor Explorer</h2>
        <p style="margin-top: 0.5rem; opacity: 0.8;">Interactive charts comparing emission factors across categories.</p>
        <div class="tab-container">
            <div class="tab-buttons">
                <button class="tab-btn active" onclick="switchTab(event, 'tabManufacturing')">Manufacturing</button>
                <button class="tab-btn" onclick="switchTab(event, 'tabFood')">Food &amp; Agriculture</button>
                <button class="tab-btn" onclick="switchTab(event, 'tabTransport')">Transport Modes</button>
            </div>
            <div class="tab-panel active" id="tabManufacturing">
                <div class="charts-grid">
                    <div class="chart-wrapper">
                        <h3>Emission Factor by Material (kg CO2e/kg)</h3>
                        <canvas id="materialBarChart"></canvas>
                    </div>
                    <div class="chart-wrapper">
                        <h3>Proportional Emission Share</h3>
                        <canvas id="materialDoughnutChart"></canvas>
                    </div>
                </div>
            </div>
            <div class="tab-panel" id="tabFood">
                <div class="charts-grid">
                    <div class="chart-wrapper">
                        <h3>Food Emission Ranking (kg CO2e/kg)</h3>
                        <canvas id="foodBarChart"></canvas>
                    </div>
                    <div class="chart-wrapper">
                        <h3>Relative Emission Magnitude</h3>
                        <canvas id="foodPolarChart"></canvas>
                    </div>
                </div>
            </div>
            <div class="tab-panel" id="tabTransport">
                <div class="charts-grid">
                    <div class="chart-wrapper">
                        <h3>Transport Mode Comparison</h3>
                        <canvas id="transportRadarChart"></canvas>
                    </div>
                    <div class="chart-wrapper">
                        <h3>Emission Factor per ton-km</h3>
                        <canvas id="transportBarChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
{% endblock %}

{% block extra_js %}
<script>
/* ============ DATA ============ */
var MATERIALS = {
    'Leather': 17.0, 'Wool': 10.4, 'Aluminum': 8.2, 'Polyester': 6.2, 'Cotton': 5.5,
    'Plastic': 3.5, 'Steel': 2.8, 'Paper': 1.3, 'Glass': 0.9, 'Wood': 0.5
};
var FOODS = {
    'Beef': 27.0, 'Lamb': 24.0, 'Shrimp': 18.0, 'Cheese': 13.5, 'Pork': 12.1,
    'Butter': 12.0, 'Turkey': 10.9, 'Chicken': 6.9, 'Fish': 5.1, 'Eggs': 4.8,
    'Rice': 4.0, 'Tofu': 2.0
};
var TRANSPORT = {'Sea': 0.015, 'Rail': 0.025, 'Road': 0.120, 'Air': 0.950};

/* ============ CHART DEFAULTS ============ */
Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';
Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";

/* ============ COLOR HELPERS ============ */
function greenTealGradient(ctx, chartArea) {
    if (!chartArea) return '#64ffb4';
    var g = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    g.addColorStop(0, '#00d9ff');
    g.addColorStop(1, '#64ffb4');
    return g;
}

var materialColors = [
    '#ff5050', '#ff6b3d', '#ff8533', '#ffa940', '#ffc53d',
    '#64ffb4', '#4de8b0', '#36d1a0', '#00d9ff', '#00b8d4'
];
var foodColors = [
    '#ff3b30', '#ff5050', '#ff6b3d', '#ff8533', '#ffa940', '#ffc53d',
    '#ffeb3b', '#c6ff00', '#64ffb4', '#00d9ff', '#00b8d4', '#4dd0e1'
];
var transportColors = ['#64ffb4', '#00d9ff', '#ff8533', '#ff5050'];

/* ============ STORED CHART INSTANCES ============ */
var charts = {};

function destroyChart(id) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

/* ============ MANUFACTURING CHARTS ============ */
function createMaterialCharts() {
    var labels = Object.keys(MATERIALS);
    var data = Object.values(MATERIALS);

    /* Vertical Bar Chart */
    destroyChart('materialBar');
    var ctx1 = document.getElementById('materialBarChart').getContext('2d');
    charts['materialBar'] = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'kg CO2e/kg',
                data: data,
                backgroundColor: materialColors,
                borderColor: materialColors.map(function(c) { return c; }),
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1500, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(10, 25, 47, 0.95)',
                    borderColor: '#64ffb4',
                    borderWidth: 1,
                    titleColor: '#64ffb4',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(ctx) { return ctx.parsed.y + ' kg CO2e/kg'; }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 10 }, maxRotation: 45 },
                    grid: { display: false }
                },
                y: {
                    ticks: { color: 'rgba(255,255,255,0.5)' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    title: { display: true, text: 'kg CO2e / kg', color: 'rgba(255,255,255,0.4)' }
                }
            }
        }
    });

    /* Doughnut Chart */
    destroyChart('materialDoughnut');
    var ctx2 = document.getElementById('materialDoughnutChart').getContext('2d');
    charts['materialDoughnut'] = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: materialColors,
                borderColor: 'rgba(10, 25, 47, 0.8)',
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            animation: { animateRotate: true, duration: 1500 },
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: 'rgba(255,255,255,0.7)', font: { size: 10 }, padding: 8, usePointStyle: true, pointStyleWidth: 8 }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 25, 47, 0.95)',
                    borderColor: '#64ffb4',
                    borderWidth: 1,
                    titleColor: '#64ffb4',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(ctx) {
                            var total = ctx.dataset.data.reduce(function(a, b) { return a + b; }, 0);
                            var pct = ((ctx.parsed / total) * 100).toFixed(1);
                            return ctx.label + ': ' + ctx.parsed + ' kg (' + pct + '%)';
                        }
                    }
                }
            }
        }
    });
}

/* ============ FOOD CHARTS ============ */
function createFoodCharts() {
    var sorted = Object.entries(FOODS).sort(function(a, b) { return a[1] - b[1]; });
    var labels = sorted.map(function(e) { return e[0]; });
    var data = sorted.map(function(e) { return e[1]; });
    var colors = data.map(function(v) {
        var ratio = v / 27.0;
        if (ratio > 0.7) return '#ff5050';
        if (ratio > 0.4) return '#ff8533';
        if (ratio > 0.2) return '#ffc53d';
        return '#64ffb4';
    });

    /* Horizontal Bar Chart */
    destroyChart('foodBar');
    var ctx1 = document.getElementById('foodBarChart').getContext('2d');
    charts['foodBar'] = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'kg CO2e/kg',
                data: data,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1500, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(10, 25, 47, 0.95)',
                    borderColor: '#ff8533',
                    borderWidth: 1,
                    titleColor: '#ff8533',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(ctx) { return ctx.parsed.x + ' kg CO2e/kg'; }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: 'rgba(255,255,255,0.5)' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    title: { display: true, text: 'kg CO2e / kg', color: 'rgba(255,255,255,0.4)' }
                },
                y: {
                    ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 10 } },
                    grid: { display: false }
                }
            }
        }
    });

    /* Polar Area Chart */
    destroyChart('foodPolar');
    var ctx2 = document.getElementById('foodPolarChart').getContext('2d');
    charts['foodPolar'] = new Chart(ctx2, {
        type: 'polarArea',
        data: {
            labels: Object.keys(FOODS),
            datasets: [{
                data: Object.values(FOODS),
                backgroundColor: foodColors.map(function(c) { return c + '99'; }),
                borderColor: foodColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { animateRotate: true, duration: 1500 },
            scales: {
                r: {
                    ticks: { color: 'rgba(255,255,255,0.5)', backdropColor: 'transparent', font: { size: 9 } },
                    grid: { color: 'rgba(255,255,255,0.08)' },
                    angleLines: { color: 'rgba(255,255,255,0.08)' }
                }
            },
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: 'rgba(255,255,255,0.7)', font: { size: 9 }, padding: 6, usePointStyle: true, pointStyleWidth: 8 }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 25, 47, 0.95)',
                    borderColor: '#ff8533',
                    borderWidth: 1,
                    titleColor: '#ff8533',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(ctx) { return ctx.label + ': ' + ctx.parsed.r + ' kg CO2e/kg'; }
                    }
                }
            }
        }
    });
}

/* ============ TRANSPORT CHARTS ============ */
function createTransportCharts() {
    var labels = Object.keys(TRANSPORT);
    var data = Object.values(TRANSPORT);

    /* Radar Chart */
    destroyChart('transportRadar');
    var ctx1 = document.getElementById('transportRadarChart').getContext('2d');
    charts['transportRadar'] = new Chart(ctx1, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Emission Factor',
                data: data,
                backgroundColor: 'rgba(100, 255, 180, 0.15)',
                borderColor: '#64ffb4',
                borderWidth: 2,
                pointBackgroundColor: transportColors,
                pointBorderColor: '#fff',
                pointBorderWidth: 1,
                pointRadius: 6,
                pointHoverRadius: 9
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1500 },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: { color: 'rgba(255,255,255,0.5)', backdropColor: 'transparent', font: { size: 10 } },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: 'rgba(255,255,255,0.8)', font: { size: 13, weight: 600 } }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(10, 25, 47, 0.95)',
                    borderColor: '#64ffb4',
                    borderWidth: 1,
                    titleColor: '#64ffb4',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(ctx) { return ctx.parsed.r + ' kg CO2e/ton-km'; }
                    }
                }
            }
        }
    });

    /* Bar Chart */
    destroyChart('transportBar');
    var ctx2 = document.getElementById('transportBarChart').getContext('2d');
    charts['transportBar'] = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'kg CO2e/ton-km',
                data: data,
                backgroundColor: transportColors,
                borderColor: transportColors,
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1500, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(10, 25, 47, 0.95)',
                    borderColor: '#64ffb4',
                    borderWidth: 1,
                    titleColor: '#64ffb4',
                    bodyColor: '#fff',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(ctx) { return ctx.parsed.y + ' kg CO2e/ton-km'; }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 13, weight: 600 } },
                    grid: { display: false }
                },
                y: {
                    ticks: { color: 'rgba(255,255,255,0.5)' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    title: { display: true, text: 'kg CO2e / ton-km', color: 'rgba(255,255,255,0.4)' }
                }
            }
        }
    });
}

/* ============ GENERAL FUNCTIONS ============ */
function toggleFormula(card) { card.classList.toggle('expanded'); }

function switchTab(event, tabId) {
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
    event.currentTarget.classList.add('active');
    document.getElementById(tabId).classList.add('active');

    /* Create charts for the newly visible tab */
    if (tabId === 'tabManufacturing') createMaterialCharts();
    else if (tabId === 'tabFood') createFoodCharts();
    else if (tabId === 'tabTransport') createTransportCharts();
}

function animateCounters() {
    document.querySelectorAll('.metric-counter').forEach(function(el) {
        var target = parseFloat(el.dataset.target);
        var start = performance.now();
        function tick(now) {
            var p = Math.min((now - start)/2000, 1);
            var e = 1 - Math.pow(1 - p, 3);
            el.textContent = target >= 100 ? Math.round(e * target) : (e * target).toFixed(2);
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    });
}

function animateRing() {
    var fill = document.getElementById('ringFill');
    var valEl = document.getElementById('ringValue');
    if (!fill || !valEl) return;
    var r2 = {{ model_info.r2_score|default:"0.95" }};
    var circ = 502.65;
    fill.style.strokeDasharray = circ;
    fill.style.strokeDashoffset = circ;
    setTimeout(function() { fill.style.strokeDashoffset = circ - (r2 * circ); }, 300);
    var start = performance.now();
    function tick(now) {
        var p = Math.min((now - start)/2000, 1);
        valEl.textContent = (p * r2).toFixed(4);
        if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

function initParticles() {
    var container = document.getElementById('particles-js');
    if (!container) return;
    for (var i = 0; i < 40; i++) {
        var p = document.createElement('div');
        var size = Math.random()*4+1;
        var opacity = Math.random()*0.4+0.1;
        p.style.cssText = 'position:absolute;width:' + size + 'px;height:' + size + 'px;background:rgba(100,255,180,' + opacity + ');border-radius:50%;left:' + Math.random()*100 + '%;top:' + Math.random()*100 + '%;pointer-events:none;';
        container.appendChild(p);
        (function(particle) {
            var y = 0;
            function move() {
                y -= 0.5 + Math.random();
                particle.style.transform = 'translateY(' + y + 'px)';
                if (particle.getBoundingClientRect().top < -10) { y = window.innerHeight + 10; particle.style.left = Math.random()*100 + '%'; }
                requestAnimationFrame(move);
            }
            move();
        })(p);
    }
}

/* ============ INIT ============ */
document.addEventListener('DOMContentLoaded', function() {
    createMaterialCharts();
    animateCounters();
    initParticles();
    animateRing();
});
</script>
{% endblock %}
"""

filepath = os.path.join('core', 'templates', 'insights.html')
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Verify
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    print("SUCCESS: File written correctly!" if lines[0].strip() == "{% extends 'base.html' %}" else "ERROR: First line is wrong!")
