from abc import ABC, abstractmethod
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
import random
import math
from models import GPSLocationLog

class BaseTelematicsProvider(ABC):
    """Abstract base class for telematics providers (LocoNav, Teltonika, Fleetx, Geotab, etc.)"""
    
    def __init__(self, provider_name: str):
        self.provider_name = provider_name
    
    @abstractmethod
    async def get_location_data(self, device_id: str, start_time: datetime, end_time: datetime) -> List[Dict]:
        """Fetch location data from provider API"""
        pass
    
    @abstractmethod
    async def get_real_time_location(self, device_id: str) -> Dict:
        """Get current real-time location"""
        pass
    
    def parse_location_data(self, raw_data: List[Dict]) -> List[GPSLocationLog]:
        """Parse provider-specific data into standard GPSLocationLog format"""
        # Each provider will implement their own parsing logic
        pass

class SimulationProvider(BaseTelematicsProvider):
    """Simulation provider that generates realistic mock GPS data"""
    
    def __init__(self):
        super().__init__("Simulation")
        # Define some realistic routes (example: Mumbai area)
        self.routes = [
            {
                "name": "Route A",
                "start": {"lat": 19.0760, "lng": 72.8777},
                "end": {"lat": 19.1136, "lng": 72.9081},
                "waypoints": [
                    {"lat": 19.0896, "lng": 72.8656},
                    {"lat": 19.1023, "lng": 72.8789}
                ]
            },
            {
                "name": "Route B",
                "start": {"lat": 19.1136, "lng": 72.9081},
                "end": {"lat": 19.2183, "lng": 72.9781},
                "waypoints": [
                    {"lat": 19.1456, "lng": 72.9234},
                    {"lat": 19.1889, "lng": 72.9456}
                ]
            },
            {
                "name": "Route C (Long Distance)",
                "start": {"lat": 19.0760, "lng": 72.8777},
                "end": {"lat": 18.5204, "lng": 73.8567},
                "waypoints": [
                    {"lat": 18.9200, "lng": 73.1100},
                    {"lat": 18.7500, "lng": 73.4300},
                    {"lat": 18.6400, "lng": 73.6800}
                ]
            }
        ]
    
    async def get_location_data(self, device_id: str, start_time: datetime, end_time: datetime) -> List[Dict]:
        """Generate realistic GPS location data for the time range"""
        locations = []
        current_time = start_time
        
        # Randomly select a route
        route = random.choice(self.routes)
        
        # Generate data points every 30 seconds to 2 minutes
        while current_time < end_time:
            # Simulate movement along the route
            progress = (current_time - start_time).total_seconds() / (end_time - start_time).total_seconds()
            
            # Calculate position based on progress
            lat, lng = self._interpolate_position(route, progress)
            
            # Simulate speed (with realistic variations)
            base_speed = random.uniform(30, 70)  # km/h
            speed = max(0, base_speed + random.uniform(-10, 10))
            
            # Simulate idle periods (0-5% chance)
            if random.random() < 0.03:
                speed = 0
            
            # Ignition is on during movement
            ignition = speed > 0
            
            locations.append({
                "device_id": device_id,
                "latitude": lat,
                "longitude": lng,
                "speed": round(speed, 2),
                "ignition": ignition,
                "timestamp": current_time
            })
            
            # Random interval between readings
            interval = random.randint(30, 120)  # 30 seconds to 2 minutes
            current_time += timedelta(seconds=interval)
        
        return locations
    
    async def get_real_time_location(self, device_id: str) -> Dict:
        """Get simulated current location"""
        route = random.choice(self.routes)
        progress = random.random()
        lat, lng = self._interpolate_position(route, progress)
        
        return {
            "device_id": device_id,
            "latitude": lat,
            "longitude": lng,
            "speed": round(random.uniform(20, 60), 2),
            "ignition": True,
            "timestamp": datetime.now(timezone.utc)
        }
    
    def _interpolate_position(self, route: Dict, progress: float) -> tuple:
        """Interpolate position along a route based on progress (0 to 1)"""
        all_points = [route["start"]] + route["waypoints"] + [route["end"]]
        
        # Calculate which segment we're on
        num_segments = len(all_points) - 1
        segment_index = min(int(progress * num_segments), num_segments - 1)
        segment_progress = (progress * num_segments) - segment_index
        
        # Interpolate between two points
        point1 = all_points[segment_index]
        point2 = all_points[segment_index + 1]
        
        lat = point1["lat"] + (point2["lat"] - point1["lat"]) * segment_progress
        lng = point1["lng"] + (point2["lng"] - point1["lng"]) * segment_progress
        
        # Add some random noise for realism
        lat += random.uniform(-0.001, 0.001)
        lng += random.uniform(-0.001, 0.001)
        
        return round(lat, 6), round(lng, 6)

class TelematicsService:
    """Provider-agnostic telematics service"""
    
    def __init__(self, provider: BaseTelematicsProvider):
        self.provider = provider
    
    async def get_location_history(self, device_id: str, start_time: datetime, end_time: datetime) -> List[Dict]:
        """Get location history from provider"""
        return await self.provider.get_location_data(device_id, start_time, end_time)
    
    async def get_current_location(self, device_id: str) -> Dict:
        """Get current location from provider"""
        return await self.provider.get_real_time_location(device_id)
    
    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two coordinates using Haversine formula (in km)"""
        R = 6371  # Earth's radius in km
        
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        
        a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlng / 2) * math.sin(dlng / 2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        
        return round(distance, 2)
    
    def calculate_trip_metrics(self, locations: List[Dict]) -> Dict:
        """Calculate trip metrics from location data"""
        if not locations or len(locations) < 2:
            return {
                "distance_km": 0,
                "duration_minutes": 0,
                "idle_time_minutes": 0,
                "average_speed": 0,
                "max_speed": 0
            }
        
        total_distance = 0
        idle_time = 0
        max_speed = 0
        speeds = []
        
        for i in range(1, len(locations)):
            prev = locations[i - 1]
            curr = locations[i]
            
            # Calculate distance between consecutive points
            dist = self.calculate_distance(
                prev["latitude"], prev["longitude"],
                curr["latitude"], curr["longitude"]
            )
            total_distance += dist
            
            # Track idle time (speed = 0 but ignition on)
            if curr["speed"] == 0 and curr["ignition"]:
                time_diff = (curr["timestamp"] - prev["timestamp"]).total_seconds() / 60
                idle_time += time_diff
            
            # Track max speed
            if curr["speed"] > max_speed:
                max_speed = curr["speed"]
            
            speeds.append(curr["speed"])
        
        # Calculate duration
        duration = (locations[-1]["timestamp"] - locations[0]["timestamp"]).total_seconds() / 60
        
        # Calculate average speed (excluding idle)
        moving_speeds = [s for s in speeds if s > 0]
        avg_speed = sum(moving_speeds) / len(moving_speeds) if moving_speeds else 0
        
        return {
            "distance_km": round(total_distance, 2),
            "duration_minutes": round(duration, 2),
            "idle_time_minutes": round(idle_time, 2),
            "average_speed": round(avg_speed, 2),
            "max_speed": round(max_speed, 2)
        }
    
    def calculate_fuel_consumption(self, distance_km: float, average_kmpl: float, fuel_price_per_liter: float) -> Dict:
        """Calculate fuel consumption and cost"""
        if average_kmpl <= 0:
            return {"fuel_consumed_liters": 0, "fuel_cost": 0}
        
        fuel_consumed = distance_km / average_kmpl
        fuel_cost = fuel_consumed * fuel_price_per_liter
        
        return {
            "fuel_consumed_liters": round(fuel_consumed, 2),
            "fuel_cost": round(fuel_cost, 2)
        }

# Factory function to get the appropriate provider
def get_telematics_provider(provider_name: str = "Simulation") -> BaseTelematicsProvider:
    """Factory to get telematics provider instance"""
    providers = {
        "Simulation": SimulationProvider,
        # Future integrations:
        # "LocoNav": LocoNavProvider,
        # "Teltonika": TeltonikaProvider,
        # "Fleetx": FleetxProvider,
        # "Geotab": GeotabProvider,
    }
    
    provider_class = providers.get(provider_name, SimulationProvider)
    return provider_class()
