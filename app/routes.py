from flask import Blueprint, Response, render_template, stream_with_context
from .archetypes import get_all_archetypes
from .simulation import simulate_one_agent #, simulate_agents
import time
import json

routes = Blueprint("routes", __name__)

@routes.route("/")
def index():
    return render_template("index.html")

@routes.route("/start-simulation-stream")
def simulation_stream():
    archetypes = get_all_archetypes()

    @stream_with_context
    def generate():
        for agent_num in range(100):
            agent = simulate_one_agent(archetypes)
            # agents = simulate_agents(archetypes, 3)
            # for agent in agents:
            payload = json.dumps(agent)
            yield f"data: {payload}\n\n"
            time.sleep(0.5)

    return Response(generate(), mimetype='text/event-stream')
