from flask import Flask, request, jsonify
from qm import QM
app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello World!"

@app.route("/kmap", methods=['POST'])
def kmap():
	data = request.get_json(force=True)
	#print(data)
	N=int(data["inputs"])
	print(N)
	qm = QM(['A','B', 'C']);
	hold=[]
	for i in range (len(data["test"])):
		print data["test"][i][N]
		if(int(data["test"][i][N])==1):
			hold.append(i)
	print hold
	print( qm.get_function(qm.solve(hold,[])[1]))
	return jsonify(data)

if __name__ == "__main__":
    app.run()