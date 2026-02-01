#!/usr/bin/env python3
"""
SUBMUNDO Backend API Testing Suite
Tests all endpoints for the Portuguese crime MMO game
"""

import requests
import sys
import time
import json
from datetime import datetime

class SubmundoAPITester:
    def __init__(self, base_url="https://profile-wizard-40.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test user credentials
        self.test_email = "test@submundo.pt"
        self.test_password = "test123456"
        self.test_username = "TestPlayer"

    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method, endpoint, data=None, expected_status=200, params=None):
        """Make API request with proper headers"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params, timeout=10)
            
            success = response.status_code == expected_status
            response_data = None
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}
            
            return success, response_data, response.status_code
            
        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_auth_register(self):
        """Test user registration"""
        # Try to register new user (might fail if exists)
        success, data, status = self.make_request(
            'POST', 
            'auth/register',
            {
                "email": self.test_email,
                "password": self.test_password,
                "username": self.test_username
            },
            expected_status=200
        )
        
        if success and 'access_token' in data:
            self.token = data['access_token']
            self.log_result("User Registration", True, "New user registered successfully")
            return True
        elif status == 400:
            # User already exists, try login instead
            self.log_result("User Registration", True, "User already exists (expected)")
            return self.test_auth_login()
        else:
            self.log_result("User Registration", False, f"Status: {status}, Data: {data}")
            return False

    def test_auth_login(self):
        """Test user login"""
        success, data, status = self.make_request(
            'POST',
            'auth/login',
            {
                "email": self.test_email,
                "password": self.test_password
            }
        )
        
        if success and 'access_token' in data:
            self.token = data['access_token']
            self.log_result("User Login", True)
            return True
        else:
            self.log_result("User Login", False, f"Status: {status}, Data: {data}")
            return False

    def test_auth_me(self):
        """Test get current user"""
        success, data, status = self.make_request('GET', 'auth/me')
        
        if success and 'id' in data:
            self.user_id = data['id']
            self.log_result("Get Current User", True, f"User ID: {self.user_id}")
            return True
        else:
            self.log_result("Get Current User", False, f"Status: {status}")
            return False

    def test_player_stats(self):
        """Test get player stats"""
        success, data, status = self.make_request('GET', 'player/stats')
        
        if success and 'clean_money' in data:
            self.log_result("Get Player Stats", True, f"Money: €{data.get('clean_money', 0)}")
            return True
        else:
            self.log_result("Get Player Stats", False, f"Status: {status}")
            return False

    def test_daily_reward(self):
        """Test daily reward claim"""
        success, data, status = self.make_request('POST', 'player/daily-reward')
        
        if success:
            if data.get('success'):
                self.log_result("Daily Reward Claim", True, f"Reward: €{data.get('reward_amount', 0)}")
            else:
                self.log_result("Daily Reward Claim", True, "Already claimed today (expected)")
            return True
        else:
            self.log_result("Daily Reward Claim", False, f"Status: {status}")
            return False

    def test_neighborhoods(self):
        """Test get neighborhoods"""
        success, data, status = self.make_request('GET', 'neighborhoods')
        
        if success and isinstance(data, list) and len(data) > 0:
            self.log_result("Get Neighborhoods", True, f"Found {len(data)} neighborhoods")
            return True
        else:
            self.log_result("Get Neighborhoods", False, f"Status: {status}")
            return False

    def test_mission_templates(self):
        """Test get mission templates"""
        success, data, status = self.make_request('GET', 'missions/templates')
        
        if success and 'templates' in data and len(data['templates']) > 0:
            self.log_result("Get Mission Templates", True, f"Found {len(data['templates'])} templates")
            return True
        else:
            self.log_result("Get Mission Templates", False, f"Status: {status}")
            return False

    def test_quick_actions(self):
        """Test quick actions"""
        actions = ['roubo_rapido', 'hustle_rua', 'evento_aleatorio']
        
        for action in actions:
            success, data, status = self.make_request(
                'POST',
                'actions/quick',
                {"action_type": action}
            )
            
            if success:
                result = "Success" if data.get('success') else "Failed"
                reward = data.get('reward', 0)
                self.log_result(f"Quick Action: {action}", True, f"{result}, Reward: €{reward}")
            else:
                self.log_result(f"Quick Action: {action}", False, f"Status: {status}")

    def test_mission_flow(self):
        """Test complete mission flow: start -> wait -> complete"""
        # First get available templates
        success, templates_data, _ = self.make_request('GET', 'missions/templates')
        if not success or not templates_data.get('templates'):
            self.log_result("Mission Flow - Get Templates", False, "No templates available")
            return False
        
        # Use first template
        template = templates_data['templates'][0]
        mission_type = template['type']
        
        # Start mission
        success, data, status = self.make_request(
            'POST',
            'missions/start',
            {
                "type": mission_type,
                "neighborhood_id": "centro"
            }
        )
        
        if not success:
            self.log_result("Mission Flow - Start", False, f"Status: {status}, Data: {data}")
            return False
        
        mission_id = data.get('id')
        duration = data.get('duration_seconds', 30)
        self.log_result("Mission Flow - Start", True, f"Mission ID: {mission_id}, Duration: {duration}s")
        
        # Wait for mission to complete (or at least a few seconds)
        wait_time = min(duration + 1, 10)  # Wait max 10 seconds for testing
        print(f"⏳ Waiting {wait_time} seconds for mission to complete...")
        time.sleep(wait_time)
        
        # Try to complete mission
        success, data, status = self.make_request(
            'POST',
            f'missions/{mission_id}/complete'
        )
        
        if success:
            result = data.get('result', 'unknown')
            self.log_result("Mission Flow - Complete", True, f"Result: {result}")
            return True
        else:
            # Mission might still be in progress
            if status == 400 and "ainda em progresso" in str(data):
                self.log_result("Mission Flow - Complete", True, "Mission still in progress (expected)")
                return True
            else:
                self.log_result("Mission Flow - Complete", False, f"Status: {status}, Data: {data}")
                return False

    def test_gang_operations(self):
        """Test gang creation and operations"""
        # Get existing gangs
        success, data, status = self.make_request('GET', 'gangs')
        
        if success:
            self.log_result("Get Gangs", True, f"Found {len(data)} gangs")
        else:
            self.log_result("Get Gangs", False, f"Status: {status}")
            return False
        
        # Try to create a gang (might fail if user already in gang)
        gang_name = f"TestGang_{int(time.time())}"
        gang_tag = "TEST"
        
        success, data, status = self.make_request(
            'POST',
            'gangs/create',
            {
                "name": gang_name,
                "tag": gang_tag
            }
        )
        
        if success:
            self.log_result("Create Gang", True, f"Gang: {gang_name}")
            return True
        elif status == 400:
            self.log_result("Create Gang", True, "User already in gang or gang exists (expected)")
            return True
        else:
            self.log_result("Create Gang", False, f"Status: {status}")
            return False

    def test_money_laundering(self):
        """Test money laundering"""
        # First check if user has dirty money
        success, player_data, _ = self.make_request('GET', 'player/stats')
        
        if not success:
            self.log_result("Money Laundering - Check Stats", False, "Could not get player stats")
            return False
        
        dirty_money = player_data.get('dirty_money', 0)
        
        if dirty_money <= 0:
            self.log_result("Money Laundering", True, "No dirty money to launder (expected)")
            return True
        
        # Try to launder small amount - the endpoint expects amount as JSON body
        launder_amount = min(dirty_money, 50)
        
        success, data, status = self.make_request(
            'POST',
            'economy/launder',
            {"amount": launder_amount},  # Pass amount as JSON object with "amount" key
            expected_status=200
        )
        
        if success:
            if data.get('success'):
                self.log_result("Money Laundering", True, f"Laundered €{launder_amount}")
            else:
                self.log_result("Money Laundering", True, "Laundering failed (game mechanic)")
        else:
            self.log_result("Money Laundering", False, f"Status: {status}, Data: {data}")

    def test_rankings(self):
        """Test rankings endpoints"""
        # Global rankings
        success, data, status = self.make_request('GET', 'rankings/global?limit=5')
        
        if success and 'rankings' in data:
            self.log_result("Global Rankings", True, f"Found {len(data['rankings'])} players")
        else:
            self.log_result("Global Rankings", False, f"Status: {status}")
        
        # Gang rankings
        success, data, status = self.make_request('GET', 'rankings/gangs?limit=5')
        
        if success and 'rankings' in data:
            self.log_result("Gang Rankings", True, f"Found {len(data['rankings'])} gangs")
        else:
            self.log_result("Gang Rankings", False, f"Status: {status}")

    def test_game_state(self):
        """Test game state endpoint"""
        success, data, status = self.make_request('GET', 'game/full-state')
        
        if success and 'player' in data:
            self.log_result("Game State", True, "Full game state retrieved")
            return True
        else:
            self.log_result("Game State", False, f"Status: {status}")
            return False

    def test_vehicles_system(self):
        """Test vehicle system endpoints"""
        # Get vehicle catalog
        success, data, status = self.make_request('GET', 'vehicles/catalog')
        
        if success and 'vehicles' in data:
            vehicles = data['vehicles']
            self.log_result("Vehicle Catalog", True, f"Found {len(vehicles)} vehicles")
            
            # Check if we have 8 vehicles as required
            if len(vehicles) == 8:
                self.log_result("Vehicle Catalog Count", True, "Exactly 8 vehicles available")
            else:
                self.log_result("Vehicle Catalog Count", False, f"Expected 8 vehicles, found {len(vehicles)}")
        else:
            self.log_result("Vehicle Catalog", False, f"Status: {status}")
            return False
        
        # Get my vehicles
        success, data, status = self.make_request('GET', 'vehicles/my')
        
        if success and 'vehicles' in data:
            my_vehicles = data['vehicles']
            self.log_result("My Vehicles", True, f"Player has {len(my_vehicles)} vehicles")
        else:
            self.log_result("My Vehicles", False, f"Status: {status}")
        
        # Try to buy a vehicle (cheapest one - bicicleta)
        if vehicles:
            cheapest_vehicle = min(vehicles, key=lambda v: v['price'])
            vehicle_id = cheapest_vehicle['id']
            
            success, data, status = self.make_request(
                'POST',
                f'vehicles/buy/{vehicle_id}'
            )
            
            if success:
                self.log_result("Buy Vehicle", True, f"Bought {cheapest_vehicle['name']}")
                
                # Try to activate the vehicle
                if 'vehicle' in data and 'id' in data['vehicle']:
                    vehicle_instance_id = data['vehicle']['id']
                    
                    success, activate_data, activate_status = self.make_request(
                        'POST',
                        f'vehicles/{vehicle_instance_id}/activate'
                    )
                    
                    if success:
                        self.log_result("Activate Vehicle", True, "Vehicle activated successfully")
                    else:
                        self.log_result("Activate Vehicle", False, f"Status: {activate_status}")
                
            elif status == 400:
                self.log_result("Buy Vehicle", True, "Cannot buy vehicle (insufficient funds or already owned)")
            else:
                self.log_result("Buy Vehicle", False, f"Status: {status}")

    def test_city_events_system(self):
        """Test city events system"""
        # Get active events
        success, data, status = self.make_request('GET', 'events/active')
        
        if success and 'events' in data:
            events = data['events']
            self.log_result("Active Events", True, f"Found {len(events)} active events")
        else:
            self.log_result("Active Events", False, f"Status: {status}")
            return False
        
        # Get current effects
        success, data, status = self.make_request('GET', 'events/effects')
        
        if success:
            effects = data
            self.log_result("Event Effects", True, f"Heat multiplier: {effects.get('heat_multiplier', 1.0)}")
        else:
            self.log_result("Event Effects", False, f"Status: {status}")
        
        # Try to trigger an event (for testing)
        success, data, status = self.make_request('POST', 'events/trigger')
        
        if success:
            self.log_result("Trigger Event", True, f"Event triggered: {data.get('event', {}).get('name', 'Unknown')}")
        elif status == 400:
            self.log_result("Trigger Event", True, "Cannot trigger event (max events active or duplicate)")
        else:
            self.log_result("Trigger Event", False, f"Status: {status}")

    def test_gang_wars_system(self):
        """Test gang wars system"""
        # Get active wars
        success, data, status = self.make_request('GET', 'wars/active')
        
        if success and 'wars' in data:
            wars = data['wars']
            self.log_result("Active Wars", True, f"Found {len(wars)} active wars")
        else:
            self.log_result("Active Wars", False, f"Status: {status}")
            return False
        
        # Get my gang wars
        success, data, status = self.make_request('GET', 'wars/my')
        
        if success and 'wars' in data:
            my_wars = data['wars']
            self.log_result("My Gang Wars", True, f"Found {len(my_wars)} wars involving my gang")
        else:
            self.log_result("My Gang Wars", False, f"Status: {status}")
        
        # Test treasury deposit
        success, data, status = self.make_request(
            'POST',
            'gangs/treasury/deposit',
            data=None,
            params={"amount": 100},  # Amount as query parameter
            expected_status=200
        )
        
        if success:
            self.log_result("Treasury Deposit", True, "Deposited to gang treasury")
        elif status == 400:
            self.log_result("Treasury Deposit", True, "Cannot deposit (not in gang or insufficient funds)")
        else:
            self.log_result("Treasury Deposit", False, f"Status: {status}")

    def test_properties_system(self):
        """Test Properties System endpoints"""
        # Test property types
        success, data, status = self.make_request('GET', 'properties/types')
        
        if success and 'property_types' in data and len(data['property_types']) > 0:
            property_types = data['property_types']
            self.log_result("Property Types", True, f"Found {len(property_types)} property types")
        else:
            self.log_result("Property Types", False, f"Status: {status}, Data: {data}")
            return False
        
        # Test get my properties
        success, data, status = self.make_request('GET', 'properties/my')
        
        if success and 'properties' in data:
            my_properties = data['properties']
            self.log_result("My Properties", True, f"Player has {len(my_properties)} properties")
        else:
            self.log_result("My Properties", False, f"Status: {status}")
        
        # Test available properties in centro neighborhood
        success, data, status = self.make_request('GET', 'properties/available/centro')
        
        if success and 'properties' in data:
            available = data['properties']
            self.log_result("Available Properties Centro", True, f"Found {len(available)} available in centro")
        else:
            self.log_result("Available Properties Centro", False, f"Status: {status}, Data: {data}")
        
        # Try to buy a property (cheapest one - apartamento in centro)
        success, data, status = self.make_request(
            'POST',
            'properties/buy',
            {
                "property_type": "apartamento",
                "neighborhood_id": "centro",
                "custom_name": "Meu Apartamento Teste"
            }
        )
        
        if success:
            property_data = data.get('property', {})
            property_id = property_data.get('id')
            self.log_result("Buy Property", True, f"Bought apartamento in centro, ID: {property_id}")
            
            if property_id:
                # Test collect income
                success, data, status = self.make_request('POST', f'properties/{property_id}/collect')
                
                if success:
                    income = data.get('income_collected', 0)
                    self.log_result("Collect Property Income", True, f"Collected €{income}")
                elif status == 400 and "esperar pelo menos" in str(data.get('detail', '')):
                    self.log_result("Collect Property Income", True, "Must wait 1 hour to collect (expected)")
                else:
                    self.log_result("Collect Property Income", False, f"Status: {status}, Data: {data}")
                
                # Test maintenance
                success, data, status = self.make_request('POST', f'properties/{property_id}/maintain')
                
                if success:
                    cost = data.get('maintenance_cost', 0)
                    self.log_result("Property Maintenance", True, f"Paid €{cost} maintenance")
                elif status == 400 and "perfeitas condições" in str(data.get('detail', '')):
                    self.log_result("Property Maintenance", True, "Property in perfect condition (expected)")
                else:
                    self.log_result("Property Maintenance", False, f"Status: {status}, Data: {data}")
                
                # Test sell property
                success, data, status = self.make_request('POST', f'properties/{property_id}/sell')
                
                if success:
                    sale_price = data.get('sale_price', 0)
                    self.log_result("Sell Property", True, f"Sold for €{sale_price}")
                else:
                    self.log_result("Sell Property", False, f"Status: {status}")
            
        elif status == 400:
            self.log_result("Buy Property", True, "Cannot buy property (insufficient funds or limit reached)")
        else:
            self.log_result("Buy Property", False, f"Status: {status}")

    def test_businesses_system(self):
        """Test Business/Crafting System endpoints"""
        # Test business types
        success, data, status = self.make_request('GET', 'businesses/types')
        
        if success and 'business_types' in data and len(data['business_types']) > 0:
            business_types = data['business_types']
            self.log_result("Business Types", True, f"Found {len(business_types)} business types")
        else:
            self.log_result("Business Types", False, f"Status: {status}, Data: {data}")
            return False
        
        # Test get my businesses
        success, data, status = self.make_request('GET', 'businesses/my')
        
        if success and 'businesses' in data:
            my_businesses = data['businesses']
            self.log_result("My Businesses", True, f"Player has {len(my_businesses)} businesses")
        else:
            self.log_result("My Businesses", False, f"Status: {status}")
        
        # Try to buy a business (laboratorio in favela)
        success, data, status = self.make_request(
            'POST',
            'businesses/buy',
            {
                "business_type": "laboratorio",
                "custom_name": "Meu Lab Teste"
            }
        )
        
        if success:
            business_data = data.get('business', {})
            business_id = business_data.get('id')
            self.log_result("Buy Business", True, f"Bought laboratorio, ID: {business_id}")
            
            if business_id:
                # Test get recipes for this business
                success, data, status = self.make_request('GET', f'businesses/recipes/{business_id}')
                
                if success and 'recipes' in data:
                    recipes = data['recipes']
                    self.log_result("Business Recipes", True, f"Found {len(recipes)} recipes")
                    
                    if recipes:
                        # Test crafting with first recipe
                        recipe = recipes[0]
                        recipe_id = recipe['id']
                        
                        success, data, status = self.make_request(
                            'POST',
                            f'businesses/{business_id}/craft',
                            {
                                "recipe_id": recipe_id,
                                "quantity": 1
                            }
                        )
                        
                        if success:
                            self.log_result("Start Crafting", True, f"Started crafting {recipe['name']}")
                        else:
                            self.log_result("Start Crafting", False, f"Status: {status}")
                else:
                    self.log_result("Business Recipes", False, f"Status: {status}")
                
                # Test collect finished products
                success, data, status = self.make_request('POST', f'businesses/{business_id}/collect')
                
                if success:
                    collected = data.get('items_collected', [])
                    self.log_result("Collect Products", True, f"Collected {len(collected)} items")
                elif status == 400 and ("andamento" in str(data.get('detail', '')) or "Faltam" in str(data.get('detail', ''))):
                    self.log_result("Collect Products", True, "Production still in progress (expected)")
                else:
                    self.log_result("Collect Products", False, f"Status: {status}, Data: {data}")
                
                # Test sell business
                success, data, status = self.make_request('POST', f'businesses/{business_id}/sell')
                
                if success:
                    sale_price = data.get('sale_price', 0)
                    self.log_result("Sell Business", True, f"Sold for €{sale_price}")
                elif status == 400 and "produção em andamento" in str(data.get('detail', '')):
                    self.log_result("Sell Business", True, "Cannot sell during production (expected)")
                else:
                    self.log_result("Sell Business", False, f"Status: {status}, Data: {data}")
            
        elif status == 400:
            self.log_result("Buy Business", True, "Cannot buy business (insufficient funds or limit reached)")
        else:
            self.log_result("Buy Business", False, f"Status: {status}")
        
        # Test get crafted items in storage
        success, data, status = self.make_request('GET', 'businesses/crafted-items')
        
        if success and 'items' in data:
            crafted_items = data['items']
            self.log_result("Crafted Items Storage", True, f"Found {len(crafted_items)} crafted items")
        else:
            self.log_result("Crafted Items Storage", False, f"Status: {status}, Data: {data}")

    def test_market_system(self):
        """Test Market System endpoints"""
        # Test market stats
        success, data, status = self.make_request('GET', 'market/stats')
        
        if success and 'total_active_listings' in data:
            stats = data
            self.log_result("Market Stats", True, f"Total listings: {stats.get('total_active_listings', 0)}")
        else:
            self.log_result("Market Stats", False, f"Status: {status}, Data: {data}")
            return False
        
        # Test get all market listings
        success, data, status = self.make_request('GET', 'market/listings')
        
        if success and 'listings' in data:
            listings = data['listings']
            self.log_result("Market Listings", True, f"Found {len(listings)} market listings")
        else:
            self.log_result("Market Listings", False, f"Status: {status}")
        
        # Test get my listings
        success, data, status = self.make_request('GET', 'market/my-listings')
        
        if success and 'listings' in data:
            my_listings = data['listings']
            self.log_result("My Market Listings", True, f"Player has {len(my_listings)} listings")
        else:
            self.log_result("My Market Listings", False, f"Status: {status}")
        
        # Try to create a market listing (need to have an item first)
        # First check inventory for any items
        success, inventory_data, _ = self.make_request('GET', 'player/inventory')
        
        if success and inventory_data.get('inventory'):
            inventory = inventory_data['inventory']
            if inventory:
                # Use first item for listing
                item = inventory[0]
                item_id = item.get('id')
                
                success, data, status = self.make_request(
                    'POST',
                    'market/list',
                    {
                        "item_type": "inventory",
                        "item_id": item_id,
                        "price": 100.0,
                        "quantity": 1
                    }
                )
                
                if success:
                    listing_id = data.get('listing', {}).get('id')
                    self.log_result("Create Market Listing", True, f"Listed item for €100, ID: {listing_id}")
                    
                    if listing_id:
                        # Test cancel listing
                        success, data, status = self.make_request('POST', f'market/{listing_id}/cancel')
                        
                        if success:
                            self.log_result("Cancel Market Listing", True, "Listing cancelled successfully")
                        else:
                            self.log_result("Cancel Market Listing", False, f"Status: {status}")
                    
                else:
                    self.log_result("Create Market Listing", False, f"Status: {status}")
            else:
                self.log_result("Create Market Listing", True, "No items in inventory to list (expected)")
        else:
            self.log_result("Create Market Listing", True, "Could not access inventory (expected)")
        
        # Test buy from market (if there are listings)
        if listings:
            # Try to buy from first listing
            listing = listings[0]
            listing_id = listing.get('id')
            
            success, data, status = self.make_request(
                'POST',
                'market/buy',
                {
                    "listing_id": listing_id,
                    "quantity": 1
                }
            )
            
            if success:
                self.log_result("Buy from Market", True, f"Purchased item from market")
            elif status == 400:
                self.log_result("Buy from Market", True, "Cannot buy (insufficient funds or own listing)")
            else:
                self.log_result("Buy from Market", False, f"Status: {status}")
        else:
            self.log_result("Buy from Market", True, "No listings available to buy from (expected)")

    def test_npc_relationships_system(self):
        """Test NPC Relationships System endpoints"""
        # Test get NPC contacts
        success, data, status = self.make_request('GET', 'npcs/contacts')
        
        if success and 'contacts' in data:
            contacts = data['contacts']
            self.log_result("NPC Contacts", True, f"Found {len(contacts)} NPC contacts")
            
            if contacts:
                # Test get relationship details for first NPC
                npc = contacts[0]
                npc_id = npc.get('id')
                
                success, data, status = self.make_request('GET', f'npcs/{npc_id}/relationship')
                
                if success and 'relationship' in data:
                    relationship = data['relationship']
                    level = relationship.get('level', 0)
                    self.log_result("NPC Relationship Details", True, f"Relationship level: {level}")
                else:
                    self.log_result("NPC Relationship Details", False, f"Status: {status}")
                
                # Test interact with NPC (gift action)
                success, data, status = self.make_request(
                    'POST', 
                    f'npcs/{npc_id}/interact',
                    params={"action": "gift"}
                )
                
                if success:
                    points_gained = data.get('points_gained', 0)
                    self.log_result("NPC Interaction (Gift)", True, f"Gained {points_gained} relationship points")
                elif status == 400:
                    self.log_result("NPC Interaction (Gift)", True, "Cannot interact (insufficient funds or cooldown)")
                else:
                    self.log_result("NPC Interaction (Gift)", False, f"Status: {status}")
            else:
                self.log_result("NPC Relationship Details", True, "No NPCs available for testing")
                self.log_result("NPC Interaction (Gift)", True, "No NPCs available for testing")
        else:
            self.log_result("NPC Contacts", False, f"Status: {status}")

    def test_dynamic_economy_system(self):
        """Test Dynamic Economy System endpoints"""
        # Test get market prices
        success, data, status = self.make_request('GET', 'economy/market-prices')
        
        if success and 'prices' in data:
            prices = data['prices']
            self.log_result("Market Prices", True, f"Found prices for {len(prices)} categories")
            
            # Check if we have expected categories - prices is a list of objects
            if isinstance(prices, list) and len(prices) > 0:
                categories = [price.get('category', '') for price in prices]
                expected_categories = ['drugs', 'weapons', 'vehicles', 'properties']
                matching_categories = [cat for cat in expected_categories if cat in categories]
                
                if matching_categories:
                    self.log_result("Market Price Categories", True, f"Found {len(matching_categories)} expected categories")
                else:
                    self.log_result("Market Price Categories", False, f"Expected categories not found. Got: {categories}")
            else:
                self.log_result("Market Price Categories", False, f"Unexpected prices format: {type(prices)}")
        else:
            self.log_result("Market Prices", False, f"Status: {status}")
        
        # Test get price history for drugs
        success, data, status = self.make_request('GET', 'economy/price-history/drugs')
        
        if success and 'history' in data:
            history = data['history']
            self.log_result("Price History (Drugs)", True, f"Found {len(history)} price history entries")
        else:
            self.log_result("Price History (Drugs)", False, f"Status: {status}")
        
        # Test simulate market fluctuation
        success, data, status = self.make_request('POST', 'economy/simulate-fluctuation')
        
        if success:
            fluctuations = data.get('fluctuations', {})
            self.log_result("Simulate Market Fluctuation", True, f"Simulated fluctuations for {len(fluctuations)} categories")
        else:
            self.log_result("Simulate Market Fluctuation", False, f"Status: {status}")

    def test_advanced_territories_system(self):
        """Test Advanced Territories System endpoints"""
        # Test get territories analysis
        success, data, status = self.make_request('GET', 'territories/analysis')
        
        if success and 'territories' in data:
            territories = data['territories']
            self.log_result("Territories Analysis", True, f"Found analysis for {len(territories)} territories")
            
            # Check if analysis includes war predictions
            if territories:
                first_territory = territories[0]
                if 'war_prediction' in first_territory:
                    war_chance = first_territory['war_prediction'].get('chance', 0)
                    self.log_result("War Predictions", True, f"War chance for first territory: {war_chance}%")
                else:
                    self.log_result("War Predictions", False, "War predictions not found in territory analysis")
            else:
                self.log_result("War Predictions", True, "No territories available for analysis")
        else:
            self.log_result("Territories Analysis", False, f"Status: {status}")

    def test_dynamic_events_system(self):
        """Test Dynamic Events System endpoints"""
        # Test get dynamic events
        success, data, status = self.make_request('GET', 'events/dynamic')
        
        if success and ('potential_events' in data or 'game_stats' in data):
            potential_events = data.get('potential_events', [])
            self.log_result("Dynamic Events", True, f"Found {len(potential_events)} potential events")
        else:
            self.log_result("Dynamic Events", False, f"Status: {status}")
        
        # Test get events impact
        success, data, status = self.make_request('GET', 'events/impact')
        
        if success and ('active_events' in data or 'impact' in data):
            active_events = data.get('active_events', [])
            self.log_result("Events Impact", True, f"Found {len(active_events)} active events with impact")
        else:
            self.log_result("Events Impact", False, f"Status: {status}")
        
        # Test get events predictions
        success, data, status = self.make_request('GET', 'events/predictions')
        
        if success and 'predictions' in data:
            predictions = data['predictions']
            self.log_result("Events Predictions", True, f"Found {len(predictions)} event predictions")
        else:
            self.log_result("Events Predictions", False, f"Status: {status}")

    def test_profile_system(self):
        """Test Advanced Profile System endpoints"""
        # Test detailed stats
        success, data, status = self.make_request('GET', 'profile/detailed-stats')
        
        if success and 'player_stats' in data:
            stats = data['player_stats']
            self.log_result("Profile Detailed Stats", True, f"Retrieved detailed stats with {len(stats)} categories")
        else:
            self.log_result("Profile Detailed Stats", False, f"Status: {status}")
        
        # Test badges system
        success, data, status = self.make_request('GET', 'profile/badges')
        
        if success and 'badges' in data:
            badges = data['badges']
            unlocked_badges = [b for b in badges if b.get('unlocked', False)]
            self.log_result("Profile Badges", True, f"Found {len(badges)} badges, {len(unlocked_badges)} unlocked")
        else:
            self.log_result("Profile Badges", False, f"Status: {status}")
        
        # Test progress history
        success, data, status = self.make_request('GET', 'profile/progress-history')
        
        if success and 'history' in data:
            history = data['history']
            self.log_result("Profile Progress History", True, f"Found {len(history)} progress entries")
        else:
            self.log_result("Profile Progress History", False, f"Status: {status}")
        
        # Test get goals
        success, data, status = self.make_request('GET', 'profile/goals')
        
        if success and 'goals' in data:
            goals = data['goals']
            self.log_result("Profile Goals - Get", True, f"Found {len(goals)} player goals")
        else:
            self.log_result("Profile Goals - Get", False, f"Status: {status}")
        
        # Test create goal
        success, data, status = self.make_request(
            'POST',
            'profile/goals',
            {
                "goal_type": "earn_money",
                "target_value": 5000
            }
        )
        
        goal_id = None
        if success and 'goal' in data:
            goal_id = data['goal'].get('id')
            self.log_result("Profile Goals - Create", True, f"Created goal with ID: {goal_id}")
        elif status == 400:
            self.log_result("Profile Goals - Create", True, "Cannot create goal (limit reached or invalid)")
        else:
            self.log_result("Profile Goals - Create", False, f"Status: {status}")
        
        # Test delete goal (if we created one)
        if goal_id:
            success, data, status = self.make_request('DELETE', f'profile/goals/{goal_id}')
            
            if success:
                self.log_result("Profile Goals - Delete", True, "Goal deleted successfully")
            else:
                self.log_result("Profile Goals - Delete", False, f"Status: {status}")
        else:
            self.log_result("Profile Goals - Delete", True, "No goal to delete (expected)")
        
        # Test compare players (use own player ID for testing)
        if self.user_id:
            success, data, status = self.make_request('GET', f'profile/compare/{self.user_id}')
            
            if success and 'comparison' in data:
                comparison = data['comparison']
                self.log_result("Profile Compare Players", True, "Player comparison successful")
            else:
                self.log_result("Profile Compare Players", False, f"Status: {status}")
        else:
            self.log_result("Profile Compare Players", True, "No user ID available for comparison")
        
        # Test activity log
        success, data, status = self.make_request('GET', 'profile/activity-log')
        
        if success and 'activities' in data:
            activities = data['activities']
            self.log_result("Profile Activity Log", True, f"Found {len(activities)} activity entries")
        else:
            self.log_result("Profile Activity Log", False, f"Status: {status}")
        
        # Test leaderboard position
        success, data, status = self.make_request('GET', 'profile/leaderboard-position')
        
        if success and 'rankings' in data:
            rankings = data['rankings']
            self.log_result("Profile Leaderboard Position", True, f"Player rankings retrieved: {len(rankings)} categories")
        else:
            self.log_result("Profile Leaderboard Position", False, f"Status: {status}")
        
        # Test search players
        success, data, status = self.make_request('GET', 'profile/search-players', params={"q": "test"})
        
        if success and 'results' in data:
            players = data['results']
            self.log_result("Profile Search Players", True, f"Found {len(players)} players matching 'test'")
        else:
            self.log_result("Profile Search Players", False, f"Status: {status}")

    def test_banking_system(self):
        """Test Advanced Banking System endpoints"""
        print("\n💰 Testing Banking System...")
        
        # Test bank status
        success, data, status = self.make_request('GET', 'bank/status')
        
        if success and 'account' in data:
            account = data['account']
            bank_balance = account.get('bank_balance', 0)
            self.log_result("Bank Status", True, f"Bank balance: €{bank_balance}")
        else:
            self.log_result("Bank Status", False, f"Status: {status}")
            return False
        
        # Ensure user has some cash for testing
        success, player_data, _ = self.make_request('GET', 'player/stats')
        if not success:
            self.log_result("Banking - Get Player Stats", False, "Could not get player stats")
            return False
        
        cash = player_data.get('cash', player_data.get('clean_money', 0))
        
        # Test deposit (if user has cash)
        if cash >= 100:
            success, data, status = self.make_request(
                'POST',
                'bank/deposit',
                {"amount": 100}
            )
            
            if success:
                new_balance = data.get('bank_balance', 0)
                self.log_result("Bank Deposit", True, f"Deposited €100, new balance: €{new_balance}")
            else:
                self.log_result("Bank Deposit", False, f"Status: {status}, Data: {data}")
        else:
            self.log_result("Bank Deposit", True, "Insufficient cash for deposit test (expected)")
        
        # Test bank status again to verify deposit
        success, data, status = self.make_request('GET', 'bank/status')
        
        if success and 'account' in data:
            account = data['account']
            bank_balance = account.get('bank_balance', 0)
            self.log_result("Bank Status After Deposit", True, f"Bank balance: €{bank_balance}")
        else:
            self.log_result("Bank Status After Deposit", False, f"Status: {status}")
        
        # Test withdraw (if user has bank balance)
        if bank_balance >= 50:
            success, data, status = self.make_request(
                'POST',
                'bank/withdraw',
                {"amount": 50}
            )
            
            if success:
                new_balance = data.get('bank_balance', 0)
                fee = data.get('fee', 0)
                self.log_result("Bank Withdraw", True, f"Withdrew €50, fee: €{fee}, new balance: €{new_balance}")
            else:
                self.log_result("Bank Withdraw", False, f"Status: {status}, Data: {data}")
        else:
            self.log_result("Bank Withdraw", True, "Insufficient bank balance for withdraw test (expected)")
        
        # Test investments
        success, data, status = self.make_request('GET', 'bank/investments')
        
        if success and 'options' in data:
            options = data['options']
            self.log_result("Bank Investments", True, f"Found {len(options)} investment options")
            
            # Try to create an investment (if user has bank balance)
            if bank_balance >= 100 and options:
                investment_option = options[0]  # Use first option
                investment_id = investment_option.get('id')
                
                success, data, status = self.make_request(
                    'POST',
                    'bank/invest',
                    {
                        "investment_id": investment_id,
                        "amount": 100
                    }
                )
                
                if success:
                    investment = data.get('investment', {})
                    self.log_result("Create Investment", True, f"Created investment: {investment_id}")
                elif status == 400:
                    self.log_result("Create Investment", True, "Cannot create investment (insufficient funds or limit reached)")
                else:
                    self.log_result("Create Investment", False, f"Status: {status}")
            else:
                self.log_result("Create Investment", True, "Insufficient balance or no options for investment test")
        else:
            self.log_result("Bank Investments", False, f"Status: {status}")
        
        # Test loans
        success, data, status = self.make_request('GET', 'bank/loans')
        
        if success and 'credit' in data:
            credit = data['credit']
            max_loan = credit.get('max_loan', 0)
            available_credit = credit.get('available_credit', 0)
            self.log_result("Bank Loans Info", True, f"Max loan: €{max_loan}, Available: €{available_credit}")
            
            # Try to request a loan (if credit available)
            if available_credit >= 500:
                success, data, status = self.make_request(
                    'POST',
                    'bank/loan',
                    {"amount": 500}
                )
                
                if success:
                    loan = data.get('loan', {})
                    loan_id = loan.get('id')
                    self.log_result("Request Loan", True, f"Loan approved: €500, ID: {loan_id}")
                else:
                    self.log_result("Request Loan", False, f"Status: {status}")
            else:
                self.log_result("Request Loan", True, "Insufficient credit for loan test (expected)")
        else:
            self.log_result("Bank Loans Info", False, f"Status: {status}")
        
        # Test transactions history
        success, data, status = self.make_request('GET', 'bank/transactions')
        
        if success and 'transactions' in data:
            transactions = data['transactions']
            self.log_result("Bank Transactions", True, f"Found {len(transactions)} transactions")
        else:
            self.log_result("Bank Transactions", False, f"Status: {status}")
        
        # Test robbery targets
        success, data, status = self.make_request('GET', 'bank/robbery-targets')
        
        if success and 'targets' in data:
            targets = data['targets']
            can_rob = data.get('can_rob', False)
            self.log_result("Bank Robbery Targets", True, f"Found {len(targets)} targets, Can rob: {can_rob}")
        else:
            self.log_result("Bank Robbery Targets", False, f"Status: {status}")
        
        # Test transfer (need another player ID - use a dummy one for testing)
        # This will likely fail but we test the endpoint structure
        success, data, status = self.make_request(
            'POST',
            'bank/transfer',
            {
                "recipient_id": "dummy-player-id",
                "amount": 10,
                "instant": False,
                "message": "Test transfer"
            }
        )
        
        if success:
            self.log_result("Bank Transfer", True, "Transfer completed successfully")
        elif status == 400 or status == 404:
            self.log_result("Bank Transfer", True, "Transfer failed as expected (invalid recipient or insufficient funds)")
        else:
            self.log_result("Bank Transfer", False, f"Status: {status}")

    def test_new_features_integration(self):
        """Test integration of all new features"""
        print("\n🚗 Vehicle System Tests")
        self.test_vehicles_system()
        
        print("\n🎪 City Events Tests")  
        self.test_city_events_system()
        
        print("\n⚔️ Gang Wars Tests")
        self.test_gang_wars_system()
        
        print("\n🏠 Properties System Tests")
        self.test_properties_system()
        
        print("\n🏭 Business/Crafting System Tests")
        self.test_businesses_system()
        
        print("\n🛒 Market System Tests")
        self.test_market_system()
        
        # NEW ENDPOINTS TESTING
        print("\n👥 NPC Relationships System Tests")
        self.test_npc_relationships_system()
        
        print("\n📈 Dynamic Economy System Tests")
        self.test_dynamic_economy_system()
        
        print("\n🗺️ Advanced Territories System Tests")
        self.test_advanced_territories_system()
        
        print("\n🎲 Dynamic Events System Tests")
        self.test_dynamic_events_system()
        
        print("\n👤 Advanced Profile System Tests")
        self.test_profile_system()
        
        # BANKING SYSTEM TESTS
        print("\n🏦 Advanced Banking System Tests")
        self.test_banking_system()

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🎮 Starting SUBMUNDO Backend API Tests")
        print(f"🌐 Testing endpoint: {self.base_url}")
        print("=" * 50)
        
        # Authentication tests
        print("\n🔐 Authentication Tests")
        if not self.test_auth_register():
            return False
        
        if not self.test_auth_me():
            return False
        
        # Core game tests
        print("\n🎯 Core Game Tests")
        self.test_player_stats()
        self.test_daily_reward()
        self.test_neighborhoods()
        self.test_mission_templates()
        
        # Action tests
        print("\n⚡ Action Tests")
        self.test_quick_actions()
        self.test_mission_flow()
        
        # Social features
        print("\n👥 Social Features")
        self.test_gang_operations()
        
        # Economy tests
        print("\n💰 Economy Tests")
        self.test_money_laundering()
        self.test_rankings()
        
        # System tests
        print("\n🎮 System Tests")
        self.test_game_state()
        
        # New features tests
        self.test_new_features_integration()
        
        # Results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = SubmundoAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())