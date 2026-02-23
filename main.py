from server.api import *


@app.get('/')
def root():
    return {'Invalid': 'Hello World!(print)'}
