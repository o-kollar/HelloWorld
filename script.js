document.addEventListener("DOMContentLoaded", () => {
    const messageInput = document.getElementById("message-input");
    
    messageInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent default Enter behavior (form submission)
            sendMessage(messageInput.value.trim());
            messageInput.blur();
        }
    });
    
    async function sendMessage(message) {
        try {
            const response = await fetch(`${url}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message }),
            });

            const result = await response.json();
            updateData(result);
            renderBar(result);
            renderChart(result.logs.updated, result.logs.altitude);
            loadMap();
        } catch (error) {
            console.error("Error sending message:", error);
        }
    }
});

const headers = { 
    "ngrok-skip-browser-warning": 'true'
};
let url = "https://97c4-2a02-ab04-3d2-f800-a1a2-ddb-431c-b6e.ngrok-free.app";

async function getDataAndRender(start, end) {
    let body = { type: 'today' };

    if (end) {
        body = {
            start: start,
            end: end,
        };
    }

    try {
        const response = await fetch(`${url}/getData`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const result = await response.json();
        updateData(result);
        renderBar(result);
        renderChart(result.logs.updated, result.logs.altitude);
        loadMap();
    } catch (error) {
        console.error(error);
    }
}

async function fetchData() {
    await getDataAndRender();
}

let Data = Alpine.reactive({
    query: '',
    parts: [],
    Route: { selected: '' },
    distance: '',
    duration: '',
    elevation: '',
    speed: '',
    path: [],
    speeds: [],
    location: '',
    totalSum: 0,

    chartOptions: {
        legend: false,
        tooltips: false,
        elements: {
            point: {
                radius: 0,
            },
        },
        scales: {
            yAxes: [
                {
                    gridLines: false,
                    scaleLabel: false,
                    ticks: {
                        display: false
                    },
                },
            ],
            xAxes: [
                {
                    gridLines: false,
                    scaleLabel: false,
                    ticks: {
                        display: false,
                    },
                },
            ],
        },
    },
});

function updateData(result) {
    Data.distance = result.total;
    Data.duration = result.duration;
    Data.elevation = result.elevation;
    Data.speed = result.speed;
    Data.speeds = result.logs.speed;
    Data.path = result.logs.location;
    Data.parts = result.parts;
}


function renderChart(updated,altitude) {

    let c = false;

    Chart.helpers.each(Chart.instances, function (instance) {
        if (instance.chart.canvas.id == 'chart') {
            c = instance;
        }
    });

    if (c) {
        c.destroy();
    }

    let ctx = document.getElementById('chart').getContext('2d');
    let chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: updated,
            datasets: [
                {
                    label: 'Altitude',
                    backgroundColor: 'rgb(232, 121, 249,0.25)',
                    borderColor: 'rgb(232, 121, 249)',
                    pointBackgroundColor: 'rgb(232, 121, 249)',
                    data: altitude,
                }
            ],
        },
        layout: {
            padding: {
                right: 10,
            },
        },
        options: Data.chartOptions,
    });   
}



window.onload = function(){loadMap()}
fetchData();

function clearInput(){
    Data.query = '';
    getDataAndRender();
}


function renderBar(data){
var ctx12 = document.getElementById("chart12").getContext("2d");
var data12 = {
  labels: data.logs.updated,
  datasets: [
    {
        type:'line',
      label: "Speed",
      backgroundColor: "#8b5cf6",
      borderColor: "#5eead4",
      borderWidth: 2,
      borderRadius:60,
      data: data.logs.speed.map(speed => speed * 3.6)
    },
    {
        type:'line',
      label: "Speed2",
      backgroundColor: "#8b5cf6",
      borderColor: "#5eead4",
      borderWidth: 2,
      borderRadius: 60,
      data: data.logs.speed.map(speed => speed * -3.6)
    }
  ] 
};

window.myBar = new Chart(ctx12, {
  type: 'line',
  data: data12,
  options: Data.chartOptions
});}


