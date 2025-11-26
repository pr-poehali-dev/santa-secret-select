import json
import os
import random
from typing import Dict, Any, List

import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage Secret Santa participant registration and assignment
    Args: event with httpMethod, body, queryStringParameters
    Returns: HTTP response with participant assignment
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database connection not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        name = body_data.get('name', '').strip()
        
        if not name:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Name is required'})
            }
        
        cursor.execute("SELECT id, name, giver_to_id FROM participants WHERE LOWER(name) = LOWER(%s)", (name,))
        existing = cursor.fetchone()
        
        if existing:
            if existing['giver_to_id']:
                cursor.execute("SELECT name FROM participants WHERE id = %s", (existing['giver_to_id'],))
                receiver = cursor.fetchone()
                cursor.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'participantId': existing['id'],
                        'participantName': existing['name'],
                        'giverTo': receiver['name'] if receiver else None
                    })
                }
            else:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'participantId': existing['id'],
                        'participantName': existing['name'],
                        'giverTo': None
                    })
                }
        
        cursor.execute("INSERT INTO participants (name) VALUES (%s) RETURNING id, name", (name,))
        new_participant = cursor.fetchone()
        conn.commit()
        
        cursor.execute("SELECT id, name, giver_to_id FROM participants WHERE giver_to_id IS NULL")
        unassigned = cursor.fetchall()
        
        if len(unassigned) >= 2:
            participants_list = [{'id': p['id'], 'name': p['name']} for p in unassigned]
            random.shuffle(participants_list)
            
            for i, participant in enumerate(participants_list):
                next_index = (i + 1) % len(participants_list)
                receiver_id = participants_list[next_index]['id']
                cursor.execute("UPDATE participants SET giver_to_id = %s WHERE id = %s", (receiver_id, participant['id']))
            
            conn.commit()
            
            cursor.execute("SELECT giver_to_id FROM participants WHERE id = %s", (new_participant['id'],))
            updated = cursor.fetchone()
            cursor.execute("SELECT name FROM participants WHERE id = %s", (updated['giver_to_id'],))
            receiver = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'participantId': new_participant['id'],
                    'participantName': new_participant['name'],
                    'giverTo': receiver['name']
                })
            }
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'participantId': new_participant['id'],
                'participantName': new_participant['name'],
                'giverTo': None
            })
        }
    
    if method == 'GET':
        cursor.execute("SELECT COUNT(*) as count FROM participants")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'participantCount': result['count']})
        }
    
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
