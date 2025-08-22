from config.database import db
from flask import jsonify
from sqlalchemy import text
import json

class PricingPlan:
    @staticmethod
    def get_all_plans_with_features():
        """Retrieve all pricing plans with their features"""
        try:
            # Query to get all pricing plans
            plans_query = text("""
                SELECT id, plan_name, billing_cycle, price, currency, description 
                FROM pricing_plans
                ORDER BY price ASC
            """)
            
            # Query to get features for each plan
            features_query = text("""
                SELECT plan_id, feature_name, is_included
                FROM pricing_plan_features
                ORDER BY display_order ASC
            """)
            
            plans = db.session.execute(plans_query).fetchall()
            features = db.session.execute(features_query).fetchall()
            
            # Convert to dictionary format
            result = []
            for plan in plans:
                plan_dict = {
                    'id': plan.id,
                    'plan_name': plan.plan_name,
                    'billing_cycle': plan.billing_cycle,
                    'price': float(plan.price),
                    'currency': plan.currency,
                    'description': plan.description,
                    'features': []
                }
                
                # Add features to each plan
                for feature in features:
                    if feature.plan_id == plan.id:
                        plan_dict['features'].append({
                            'feature_name': feature.feature_name,
                            'is_included': feature.is_included
                        })
                
                result.append(plan_dict)
            
            return result
            
        except Exception as e:
            print(f"Error fetching pricing plans: {e}")
            return []
