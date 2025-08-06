"""
Report Routes
Handles reporting and export functionality
"""

from flask import Blueprint, request, jsonify, send_file
from app.models import Visit
from app.utils import authenticate_token
import pandas as pd
import tempfile
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/reports', methods=['GET'])
@authenticate_token
def get_reports():
    """Get visit reports with filtering"""
    try:
        # Extract query parameters
        filters = {}
        
        if request.args.get('date_from'):
            filters['date_from'] = request.args.get('date_from')
        if request.args.get('date_to'):
            filters['date_to'] = request.args.get('date_to')
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        if request.args.get('host_email'):
            filters['host_email'] = request.args.get('host_email')
        
        # Get visits based on filters
        visits = Visit.get_all_visits(filters)
        
        # Calculate summary statistics
        total_visits = len(visits)
        checked_in = len([v for v in visits if v['status'] == 'checked-in'])
        checked_out = len([v for v in visits if v['status'] == 'checked-out'])
        pending = len([v for v in visits if v['status'] == 'pending'])
        
        # Group by date for charts
        visits_by_date = {}
        for visit in visits:
            date = str(visit['visit_date'])
            if date not in visits_by_date:
                visits_by_date[date] = 0
            visits_by_date[date] += 1
        
        return jsonify({
            'summary': {
                'total_visits': total_visits,
                'checked_in': checked_in,
                'checked_out': checked_out,
                'pending': pending
            },
            'visits_by_date': visits_by_date,
            'visits': visits,
            'filters_applied': filters
        }), 200
        
    except Exception as e:
        logger.error(f"Get reports error: {str(e)}")
        return jsonify({'error': 'Failed to generate reports'}), 500

@reports_bp.route('/reports/export', methods=['GET'])
@authenticate_token
def export_reports():
    """Export reports to CSV/Excel"""
    try:
        # Get export format (default to CSV)
        export_format = request.args.get('format', 'csv').lower()
        
        # Extract filters
        filters = {}
        if request.args.get('date_from'):
            filters['date_from'] = request.args.get('date_from')
        if request.args.get('date_to'):
            filters['date_to'] = request.args.get('date_to')
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        
        # Get visits data
        visits = Visit.get_all_visits(filters)
        
        if not visits:
            return jsonify({'error': 'No data found for export'}), 404
        
        # Convert to DataFrame
        df = pd.DataFrame(visits)
        
        # Select relevant columns for export
        export_columns = [
            'visit_id', 'visitor_name', 'visitor_email', 'visitor_phone',
            'visitor_company', 'purpose_of_visit', 'host_name', 'host_email',
            'visit_date', 'check_in_time', 'check_out_time', 'status'
        ]
        
        # Filter columns that exist in the data
        available_columns = [col for col in export_columns if col in df.columns]
        df_export = df[available_columns]
        
        # Create temporary file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if export_format == 'excel':
            filename = f'visitor_reports_{timestamp}.xlsx'
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
            df_export.to_excel(temp_file.name, index=False)
            mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        else:
            filename = f'visitor_reports_{timestamp}.csv'
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.csv')
            df_export.to_csv(temp_file.name, index=False)
            mimetype = 'text/csv'
        
        temp_file.close()
        
        def remove_file(response):
            try:
                os.unlink(temp_file.name)
            except Exception:
                pass
            return response
        
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=filename,
            mimetype=mimetype
        )
        
    except Exception as e:
        logger.error(f"Export reports error: {str(e)}")
        return jsonify({'error': 'Failed to export reports'}), 500

@reports_bp.route('/reports/dashboard-stats', methods=['GET'])
@authenticate_token
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        counts = Visit.get_visit_counts()
        
        # Calculate additional metrics
        # In a full implementation, you'd calculate trends, averages, etc.
        
        dashboard_stats = {
            'total_visits': counts.get('total_visits', 0),
            'today_visits': counts.get('today_visits', 0),
            'checked_in': counts.get('checked_in', 0),
            'checked_out': counts.get('checked_out', 0),
            'pending': counts.get('pending', 0),
            'completion_rate': 0,  # Calculate based on check-in/check-out ratio
            'avg_visit_duration': 0,  # Calculate average visit time
            'peak_hours': []  # Most active hours
        }
        
        # Calculate completion rate
        if counts.get('total_visits', 0) > 0:
            dashboard_stats['completion_rate'] = round(
                (counts.get('checked_out', 0) / counts.get('total_visits', 1)) * 100, 2
            )
        
        return jsonify(dashboard_stats), 200
        
    except Exception as e:
        logger.error(f"Get dashboard stats error: {str(e)}")
        return jsonify({'error': 'Failed to retrieve dashboard statistics'}), 500
