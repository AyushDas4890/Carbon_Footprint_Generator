"""
Predictor API views — v2.

Now uses Pydantic schemas for clean validation. New endpoints:
  - POST /api/predict/          single product (existing, schema-validated)
  - POST /api/compare/          compare 2-10 products side-by-side
  - GET  /api/materials/        list supported materials
  - GET  /api/model-info/       model metrics
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from pydantic import ValidationError

from .services import CarbonFootprintService
from .schemas import PredictRequest, CompareRequest
from core.models import PredictionLog

logger = logging.getLogger(__name__)


def _validation_response(exc: ValidationError):
    """Pretty-print Pydantic errors as a 400."""
    return Response(
        {"success": False, "error": "Validation failed",
         "details": [{"field": ".".join(map(str, e["loc"])),
                      "msg": e["msg"]} for e in exc.errors()]},
        status=status.HTTP_400_BAD_REQUEST,
    )


class PredictCarbonFootprintView(APIView):
    """POST /api/predict/   body: PredictRequest (see predictor/schemas.py)"""

    def post(self, request):
        try:
            req = PredictRequest(**request.data)
        except ValidationError as e:
            return _validation_response(e)

        service = CarbonFootprintService()
        result = service.predict(
            material=req.material,
            weight_kg=req.weight_kg,
            transport_mode=req.transport_mode,
            transport_distance_km=req.transport_distance_km,
            manufacturing_intensity=req.manufacturing_intensity,
            country=req.country,
            eol=req.eol,
        )
        if not result.get('success'):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        # Log prediction for the existing analytics dashboard
        try:
            PredictionLog.objects.create(
                product_name=req.product_name,
                material=req.material,
                weight_kg=req.weight_kg,
                transport_mode=req.transport_mode,
                transport_distance_km=req.transport_distance_km,
                predicted_co2_kg=result['co2_kg'],
                material_co2=result['breakdown']['material_co2'],
                manufacturing_co2=result['breakdown']['manufacturing_co2'],
                transport_co2=result['breakdown']['transport_co2'],
                trees_to_offset=result['compensation']['trees_per_year'],
            )
        except Exception:
            logger.warning("PredictionLog persist failed", exc_info=True)

        return Response(result, status=status.HTTP_200_OK)


class ComparePredictionsView(APIView):
    """POST /api/compare/  body: {"products": [PredictRequest, ...]}

    Lets users pit competing products against each other and see which
    has the lowest footprint, by how much, and where the difference comes
    from. This is the killer demo feature for an interview.
    """

    def post(self, request):
        try:
            req = CompareRequest(**request.data)
        except ValidationError as e:
            return _validation_response(e)

        service = CarbonFootprintService()
        rows = []
        for p in req.products:
            r = service.predict(
                material=p.material, weight_kg=p.weight_kg,
                transport_mode=p.transport_mode,
                transport_distance_km=p.transport_distance_km,
                manufacturing_intensity=p.manufacturing_intensity,
                country=p.country, eol=p.eol,
            )
            if not r.get('success'):
                return Response(r, status=status.HTTP_400_BAD_REQUEST)
            rows.append({
                'product_name': p.product_name,
                'co2_kg': r['co2_kg'],
                'rating': r.get('sustainability_rating'),
                'breakdown': r.get('breakdown'),
            })

        rows.sort(key=lambda x: x['co2_kg'])
        winner = rows[0]
        loser = rows[-1]
        delta_pct = ((loser['co2_kg'] - winner['co2_kg']) / max(winner['co2_kg'], 0.01)) * 100

        return Response({
            'success': True,
            'rankings': rows,
            'winner': winner['product_name'],
            'loser': loser['product_name'],
            'spread_pct': round(delta_pct, 1),
            'verdict': (
                f"{winner['product_name']} is {round(delta_pct, 1)}% lower-impact "
                f"than {loser['product_name']}."
            ),
        })


class GetMaterialsView(APIView):
    """GET /api/materials/  -> list of supported materials."""

    def get(self, request):
        return Response({
            'success': True,
            'materials': CarbonFootprintService().get_available_materials(),
        })


class ModelInfoView(APIView):
    """GET /api/model-info/  -> metrics + model family."""

    def get(self, request):
        return Response({
            'success': True,
            'model_info': CarbonFootprintService().get_model_info(),
        })
