# AI Service - OpenAI Integration for Chat Assistant
import os
from openai import OpenAI

class AIAssistant:
    def __init__(self):
        self.client = None
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            self.client = OpenAI(api_key=api_key)
    
    def is_available(self):
        """Check if OpenAI is configured"""
        return self.client is not None
    
    def analyze_conversation(self, messages, user_goal='relationship'):
        """
        Analyze conversation for:
        - Fraud/scam detection
        - Aggression detection
        - Suggest responses
        - General advice
        """
        if not self.client:
            return {
                'error': 'OpenAI API not configured',
                'suggestions': [],
                'warnings': [],
                'analysis': None
            }
        
        try:
            # Format conversation for analysis
            conversation_text = "\n".join([
                f"{'Du' if msg.get('is_own') else 'Partner'}: {msg.get('message', '')}"
                for msg in messages[-20:]  # Last 20 messages
            ])
            
            system_prompt = f"""Du bist ein hilfreicher Dating-Assistent für eine {self._get_goal_german(user_goal)}-Plattform.
            
Deine Aufgaben:
1. SICHERHEITSANALYSE: Erkenne Anzeichen von Betrug, Manipulation oder aggressivem Verhalten
2. ANTWORTVORSCHLÄGE: Gib 2-3 passende Antwortvorschläge basierend auf dem Gesprächsverlauf
3. KOMMUNIKATIONSTIPPS: Gib kurze Tipps zur Verbesserung der Kommunikation

Warnsignale für Betrug:
- Schnelle Liebeserklärungen (Love Bombing)
- Bitte um Geld oder finanzielle Hilfe
- Vermeidung von Videoanrufen/Treffen
- Inkonsistente Geschichten
- Druck auf schnelle Entscheidungen
- Links zu externen Seiten
- Bitte um persönliche Daten (Passwörter, Bankdaten)

Warnsignale für Aggression:
- Beleidigungen oder Herabsetzungen
- Drohungen
- Kontrollierendes Verhalten
- Respektlose Sprache

Antworte IMMER auf Deutsch und im JSON-Format:
{{
    "safety_level": "safe|caution|warning|danger",
    "warnings": ["Liste von Warnungen falls vorhanden"],
    "warning_details": "Erklärung der Warnung falls vorhanden",
    "suggestions": ["Antwortvorschlag 1", "Antwortvorschlag 2", "Antwortvorschlag 3"],
    "tips": ["Kommunikationstipp"],
    "mood_analysis": "Kurze Analyse der Stimmung des Partners"
}}"""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analysiere diese Konversation:\n\n{conversation_text}"}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            # Parse response
            import json
            try:
                result = json.loads(response.choices[0].message.content)
            except json.JSONDecodeError:
                # If not valid JSON, extract what we can
                content = response.choices[0].message.content
                result = {
                    'safety_level': 'safe',
                    'warnings': [],
                    'suggestions': [content[:200] if len(content) > 200 else content],
                    'tips': [],
                    'mood_analysis': ''
                }
            
            return result
            
        except Exception as e:
            print(f"[AI SERVICE] Error: {str(e)}")
            return {
                'error': str(e),
                'safety_level': 'unknown',
                'warnings': [],
                'suggestions': [],
                'tips': []
            }
    
    def get_response_suggestions(self, messages, context=''):
        """Get quick response suggestions based on last message"""
        if not self.client:
            return []
        
        try:
            last_message = messages[-1].get('message', '') if messages else ''
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": """Du bist ein Dating-Assistent. 
Gib 3 kurze, natürliche Antwortvorschläge auf die letzte Nachricht.
Antworte NUR mit einer JSON-Liste von 3 Strings, ohne zusätzlichen Text.
Beispiel: ["Antwort 1", "Antwort 2", "Antwort 3"]"""},
                    {"role": "user", "content": f"Letzte Nachricht vom Partner: {last_message}\n\nKontext: {context}"}
                ],
                temperature=0.8,
                max_tokens=300
            )
            
            import json
            try:
                suggestions = json.loads(response.choices[0].message.content)
                return suggestions[:3]
            except:
                return []
                
        except Exception as e:
            print(f"[AI SERVICE] Suggestions error: {str(e)}")
            return []
    
    def check_message_safety(self, message):
        """Quick check if a single message contains red flags"""
        if not self.client:
            return {'safe': True, 'reason': None}
        
        try:
            red_flags = [
                'geld', 'überweisen', 'bitcoin', 'crypto', 'investition',
                'passwort', 'bankdaten', 'kreditkarte', 'western union',
                'hilfe mir', 'dringend', 'notfall', 'stranded',
                'click here', 'link', 'gewinn', 'lotterie'
            ]
            
            message_lower = message.lower()
            for flag in red_flags:
                if flag in message_lower:
                    return {
                        'safe': False,
                        'reason': f'Potenzielle Warnung: Nachricht enthält "{flag}"'
                    }
            
            return {'safe': True, 'reason': None}
            
        except Exception as e:
            return {'safe': True, 'reason': None}
    
    def get_icebreaker(self, partner_info):
        """Generate conversation starters based on partner's profile"""
        if not self.client:
            return []
        
        try:
            profile_text = f"""
            Name: {partner_info.get('first_name', 'Unbekannt')}
            Alter: {partner_info.get('age', 'Unbekannt')}
            Stadt: {partner_info.get('city', 'Unbekannt')}
            Bio: {partner_info.get('bio', '')}
            Interessen: {', '.join(partner_info.get('interests', []))}
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": """Erstelle 3 kreative, freundliche Gesprächseröffnungen 
basierend auf dem Profil. Sei interessant aber nicht aufdringlich.
Antworte NUR mit einer JSON-Liste von 3 Strings."""},
                    {"role": "user", "content": f"Profil:\n{profile_text}"}
                ],
                temperature=0.9,
                max_tokens=300
            )
            
            import json
            try:
                return json.loads(response.choices[0].message.content)[:3]
            except:
                return []
                
        except Exception as e:
            print(f"[AI SERVICE] Icebreaker error: {str(e)}")
            return []
    
    def chat_with_assistant(self, user_message, conversation_context, partner_messages):
        """Direct chat with AI assistant about the conversation"""
        if not self.client:
            return "AI-Assistent ist nicht verfügbar. Bitte OPENAI_API_KEY konfigurieren."
        
        try:
            # Format partner messages for context
            partner_context = "\n".join([
                f"Partner: {msg.get('message', '')}" 
                for msg in partner_messages[-10:]
            ])
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": f"""Du bist ein hilfreicher Dating-Coach und Berater.
Der Benutzer chattet mit einem Match und bittet dich um Rat.

Kontext der Konversation mit dem Match:
{partner_context}

Hilf dem Benutzer mit:
- Antwortvorschlägen
- Analyse des Verhaltens des Partners
- Dating-Tipps
- Erkennung von Warnsignalen

Antworte freundlich, hilfreich und auf Deutsch."""},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"[AI SERVICE] Chat error: {str(e)}")
            return f"Fehler bei der AI-Anfrage: {str(e)}"
    
    def _get_goal_german(self, goal):
        """Convert goal to German"""
        goals = {
            'relationship': 'Beziehungs',
            'friendship': 'Freundschafts',
            'casual': 'Casual-Dating',
            'intimate_services': 'Dienstleistungs'
        }
        return goals.get(goal, 'Dating')


# Singleton instance
ai_assistant = AIAssistant()
