# C4Future Sustainability Knowledge Base — Seed Facts

Each block below is a self-contained fact with its citation. These are
deliberately short so they chunk cleanly. Replace / extend this file with
your own LCA PDFs by running `python manage.py ingest_docs <path>`.

---

## Food carbon footprint (Poore & Nemecek, 2018)

Beef from beef herds has by far the highest median greenhouse gas
emissions of any food: about 60 kg CO2-equivalent per kilogram of
product. Lamb is second at about 24 kg CO2e/kg, and cheese is around 21
kg CO2e/kg. Source: Poore, J., & Nemecek, T. (2018). Reducing food's
environmental impacts through producers and consumers. Science,
360(6392), 987-992. Citation key: PN2018.

Plant proteins are dramatically lower than animal proteins. Per kilogram
of product, peas emit about 0.9 kg CO2e, tofu about 3.0 kg CO2e, and
nuts about 0.3 kg CO2e — between 10x and 100x less than ruminant meat.
Source: Poore & Nemecek 2018 (PN2018), supplementary data.

For most foods, the largest share of emissions comes from land use and
on-farm activities, not from transport. On average, transport accounts
for less than 10% of a food product's total emissions. Eating local is
therefore a much weaker lever than eating less meat. Source: Our World
in Data (Ritchie, 2020), based on PN2018.

---

## Materials & textiles (Higg / IPCC AR6)

Cotton textile production averages about 5.5 kg CO2e per kilogram of
finished fabric, while polyester averages about 6.2 kg CO2e per kg.
Polyester is more emission-intensive per kg but lighter per garment, so
the per-garment footprint can be comparable. Leather is far higher at
around 17 kg CO2e per kg due to the upstream cattle emissions. Source:
Higg Materials Sustainability Index (Higg MSI) v3.4.

Aluminum production averages about 8.2 kg CO2e per kg of metal produced
from primary (bauxite) sources; recycled aluminum is roughly 95% lower.
Steel averages 2.8 kg CO2e per kg via the blast-furnace route.
Source: International Aluminium Institute (IAI) Life Cycle Inventory
2019, and World Steel Association sustainability data 2022.

---

## Transport emission factors (IPCC AR6 WGIII, DEFRA 2023)

Air freight is the highest-emission mainstream freight mode at roughly
0.95 kg CO2e per ton-kilometer. Road freight averages about 0.12 kg
CO2e/ton-km. Rail freight averages 0.025 kg CO2e/ton-km. Sea freight
(container ships) is the lowest at about 0.015 kg CO2e/ton-km.
Source: UK DEFRA Greenhouse Gas Reporting Conversion Factors 2023.

Because of the 60x difference between sea and air, switching a single
shipment from air to sea can reduce its transport emissions by more
than 95%. This is usually the single biggest logistics lever for a
consumer-products company. Source: DEFRA 2023; IPCC AR6 WGIII Ch.10.

---

## Energy and electricity grid intensity

Globally, the electricity grid averages about 475 g CO2e per kWh, but
this varies enormously: France is around 60 g/kWh (mostly nuclear),
Sweden around 45 g/kWh (hydro + nuclear), India around 720 g/kWh, and
Australia around 660 g/kWh (coal-heavy). Source: Ember Climate, Global
Electricity Review 2023.

A product manufactured in a low-carbon grid country can have a
manufacturing footprint up to 10x lower than the same product made in
a coal-heavy grid, for the same process. Source: Ember 2023; IEA World
Energy Outlook 2023.

---

## Carbon offsets and tree planting

A typical mature tree absorbs about 20-25 kg of CO2 per year. A young
tree absorbs much less; full sequestration takes 20+ years. Tree
planting is a long-term offset, not an instant one. Source: US EPA
"Greenhouse Gases Equivalencies Calculator" methodology.

One Renewable Energy Certificate (REC) represents 1 MWh of renewable
electricity generation, which avoids roughly 700-900 kg of CO2 in a
typical US grid context. RECs are the most liquid and verifiable offset
instrument but face additionality concerns in oversupplied markets.
Source: US EPA Green Power Partnership; EnergyTag 2023.

---

## Real-world emission equivalencies

The average passenger car emits about 0.19 kg CO2 per kilometer driven
(EU fleet average 2023), or about 0.25 kg/km in the US. A 1000 km drive
in an average US car therefore emits roughly 250 kg CO2.
Source: European Environment Agency (EEA) 2023; US EPA 2023.

Charging a smartphone uses about 0.012 kWh per full charge, producing
approximately 0.005-0.008 kg CO2e depending on the grid. A typical
laptop hour is about 0.05 kWh. Source: International Energy Agency,
"Data Centres and Data Transmission Networks" 2023.

---

## Circular economy and offsetting hierarchy

The mitigation hierarchy is: AVOID emissions first, REDUCE what you
can't avoid, REPLACE with low-carbon alternatives, and only OFFSET
the remainder. Offsetting alone, without first reducing, is widely
considered greenwashing. Source: Science Based Targets initiative
(SBTi) Net-Zero Standard v1.2, 2023.

Recycling aluminum saves about 95% of the embodied energy compared to
primary production; recycling steel saves about 60-74%; recycling
glass saves about 25-30%. These are among the highest-impact circular
economy interventions per ton. Source: Ellen MacArthur Foundation,
"Completing the Picture" 2019.
