from flask import Flask, request, jsonify, send_from_directory
from qm import QM
import os


app = Flask(__name__, static_url_path='/s')



@app.route("/kmap", methods=['POST'])
def kmap():
	data = request.get_json(force=True)
	#print(data)
	N=int(data["inputs"])
	print(N)
	qm = QM(['1','2', '3', '4', '5', '6']);
	hold=[]
	for i in range (len(data["test"])):
		print data["test"][i][N]
		if(int(data["test"][i][N])==1):
			hold.append(i)
	minimized=qm.get_function(qm.solve(hold,[])[1])
	return jsonify(minimized)


if __name__ == "__main__":
    app.run()