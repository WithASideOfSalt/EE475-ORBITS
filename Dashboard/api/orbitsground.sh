#!/bin/bash
exec > /tmp/apiservice-debug.log 2>&1
set -x
SESSION="APIService"
SESSIONEXISTS=$(tmux ls 2>/dev/null | grep $SESSION)

if [ -z "$SESSIONEXISTS"]
then
	#create a new session that the servers output is viewable from
	tmux -S /tmp/tmux-APIService new-session -d -s $SESSION

	#rename window
	tmux -S /tmp/tmux-APIService rename-window -t $SESSION:0 'APIService'
	tmux -S /tmp/tmux-APIService send-keys -t "$SESSION:0" 'source venv/bin/activate' C-m
	tmux -S /tmp/tmux-APIService send-keys -t "$SESSION:0" 'cd api' C-m
	tmux -S /tmp/tmux-APIService send-keys -t "$SESSION:0" 'gunicorn --worker-class gevent -w 1 -b 0.0.0.0:8000 api:app' C-m
fi
