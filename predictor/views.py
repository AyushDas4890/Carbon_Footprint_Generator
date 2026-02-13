from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from .services import CarbonFootprintService
from core.models import PredictionLog


class PredictCarbonFootprintView(APIView):
    """API endpoint for carbon footprint prediction"""
    
    def post(self, request):
        """
        POST /api/predict/
        
        Body:
        {
            "product_name": "Cotton T-Shirt",
            "material": "Cotton",
            "weight_kg": 0.5,
            "transport_mode": "AIR",
            "transport_distance_km": 8000,
            "manufacturing_intensity": "MEDIUM" (optional)
        }
        """
        try:
            # Extract parameters
            product_name = request.data.get('product_name', 'Unknown Product')
            material = request.data.get('material')
            weight_kg = float(request.data.get('weight_kg'))
            transport_mode = request.data.get('transport_mode')
            transport_distance_km = float(request.data.get('transport_distance_km'))
            manufacturing_intensity = request.data.get('manufacturing_intensity', 'MEDIUM')
            
            # Validate required fields
            if not all([material, weight_kg, transport_mode, transport_distance_km]):
                return Response({
                    'success': False,
                    'error': 'Missing required fields'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate ranges
            if weight_kg <= 0 or weight_kg > 1000:
                return Response({
                    'success': False,
                    'error': 'Weight must be between 0 and 1000 kg'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if transport_distance_km < 0 or transport_distance_km > 50000:
                return Response({
                    'success': False,
                    'error': 'Distance must be between 0 and 50000 km'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get prediction
            service = CarbonFootprintService()
            result = service.predict(
                material=material,
                weight_kg=weight_kg,
                transport_mode=transport_mode,
                transport_distance_km=transport_distance_km,
                manufacturing_intensity=manufacturing_intensity
            )
            
            if not result['success']:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
            # Log prediction
            PredictionLog.objects.create(
                product_name=product_name,
                material=material,
                weight_kg=weight_kg,
                transport_mode=transport_mode,
                transport_distance_km=transport_distance_km,
                predicted_co2_kg=result['co2_kg'],
                material_co2=result['breakdown']['material_co2'],
                manufacturing_co2=result['breakdown']['manufacturing_co2'],
                transport_co2=result['breakdown']['transport_co2'],
                trees_to_offset=result['compensation']['trees_per_year']
            )
            
            return Response(result, status=status.HTTP_200_OK)
        
        except ValueError as e:
            return Response({
                'success': False,
                'error': f'Invalid input: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Server error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetMaterialsView(APIView):
    """Return available materials"""
    
    def get(self, request):
        service = CarbonFootprintService()
        materials = service.get_available_materials()
        
        return Response({
            'success': True,
            'materials': materials
        })


class ModelInfoView(APIView):
    """Return model performance metrics"""
    
    def get(self, request):
        service = CarbonFootprintService()
        info = service.get_model_info()
        
        return Response({
            'success': True,
            'model_info': info
        })
