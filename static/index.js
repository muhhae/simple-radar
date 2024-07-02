const canvas = document.getElementById("radarCanvas");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;
const centerY = canvas.height;
const maxRadius = Math.min(centerX, centerY);

let data = [];

for (let i = 0; i <= 180; i++) {
	data.push({ degree: i, distance: 50 });
}

function drawRadar() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw the half-circle grid lines
	for (let i = 1; i <= 5; i++) {
		ctx.beginPath();
		ctx.arc(centerX, centerY, (i / 5) * maxRadius, Math.PI, 2 * Math.PI);
		ctx.strokeStyle = "#ccc";
		ctx.stroke();
	}

	// Draw the degree lines
	for (let i = 0; i <= 180; i += 10) {
		const radian = i * (Math.PI / 180);
		const x = centerX + maxRadius * Math.cos(radian);
		const y = centerY - maxRadius * Math.sin(radian);
		ctx.beginPath();
		ctx.moveTo(centerX, centerY);
		ctx.lineTo(x, y);
		ctx.strokeStyle = "#ccc";
		ctx.stroke();
	}

	// Plot the data points
	data.forEach((point) => {
		const radian = point.degree * (Math.PI / 180);
		const innerX =
			centerX + (point.distance / 50) * maxRadius * Math.cos(radian);
		const innerY =
			centerY - (point.distance / 50) * maxRadius * Math.sin(radian);
		const outerX = centerX + maxRadius * Math.cos(radian);
		const outerY = centerY - maxRadius * Math.sin(radian);

		// Draw the point as a small circle at the inner position
		ctx.beginPath();
		ctx.arc(innerX, innerY, 1, 0, 2 * Math.PI);
		ctx.fillStyle = "red";
		ctx.fill();

		// Draw a line from the outer edge to the point
		ctx.beginPath();
		ctx.moveTo(outerX, outerY);
		ctx.lineTo(innerX, innerY);
		ctx.strokeStyle = "red";
		ctx.stroke();
	});
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateAndDrawRadar(degree, distance) {
	const pointAtDegree = data.find((point) => point.degree === degree);
	if (pointAtDegree) {
		pointAtDegree.distance = distance;
	}

	drawRadar();
}

currentDeg = 0;

let dist = 0;
let increment = true;

drawRadar();

setInterval(() => {
	fetch(`/distance?dist=${dist}`)
		.then((response) => response.text())
		.then((data) => {
			let intData = parseInt(data, 10);
			if (intData > 50 || intData <= 5) intData = 50;
			updateAndDrawRadar(dist, intData);

			if (increment) {
				if (dist < 180) {
					dist++;
				} else {
					increment = false;
					dist--;
				}
			} else {
				if (dist > 0) {
					dist--;
				} else {
					increment = true;
					dist++;
				}
			}
		})
		.catch((error) => console.error("Error:", error));
}, 5);
