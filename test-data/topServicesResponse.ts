// Test data for Top Services API response
// This matches the format you provided

export const mockTopServicesResponse = {
  "location": {
    "latitude": "22.3389871",
    "longitude": "91.7815375", 
    "radius_km": "15"
  },
  "services": [
    {
      "banner_image": null,
      "businesses_count": "2",
      "color_code": "#FF6B6B",
      "description": null,
      "icon_image": "icons/restaurant.svg",
      "id": 1,
      "is_active": true,
      "is_featured": true,
      "is_popular": true,
      "level": 1,
      "name": "Restaurants",
      "parent_id": null,
      "slug": "restaurants",
      "sort_order": 1,
      "total_businesses": 3
    },
    {
      "banner_image": null,
      "businesses_count": "1", 
      "color_code": "#4ECDC4",
      "description": null,
      "icon_image": "icons/shopping.svg",
      "id": 13,
      "is_active": true,
      "is_featured": true,
      "is_popular": true,
      "level": 1,
      "name": "Shopping",
      "parent_id": null,
      "slug": "shopping",
      "sort_order": 2,
      "total_businesses": 1
    }
  ]
};

// Example of how the data would be displayed in the UI:
/*
Top Services Page will show:

📍 Location Info:
- Showing services within 15km of your location

🏪 Services List:
1. Restaurants (Featured, Popular)
   - 3 businesses
   - Red color theme (#FF6B6B)
   - Restaurant icon

2. Shopping (Featured, Popular)  
   - 1 business
   - Teal color theme (#4ECDC4)
   - Shopping icon

Each service card is clickable and navigates to:
/category/[service_id] (e.g., /category/1 for Restaurants)
*/
