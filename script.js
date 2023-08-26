
document.addEventListener("DOMContentLoaded", () => {
    const messageInput = document.getElementById("message-input");
    messageInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            event.preventDefault(); // Prevent default Enter behavior (form submission)
            sendMessage(messageInput.value.trim());
        }
    });
    

    function sendMessage(message) {
        // Replace 'your-api-endpoint' with your actual API endpoint
        fetch(`${url}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
        })
        .then(response => response.json())
        .then(result => {
            Data.distance = result.total;
            Data.duration = result.duration;
            Data.elevation = result.elevation;
            Data.speed = result.speed;
            Data.speeds = result.logs.speed;
            Data.path = result.logs.location;
            Data.parts = result.parts;
            console.log('PARTS DATA:',Data.parts)
            
            renderBar(result);
       renderChart(result.logs.updated, result.logs.altitude);
       loadMap();
        })
        .catch(error => {
            console.error("Error sending message:", error);
        });
    }
});



const headers =  { 
    "ngrok-skip-browser-warning": 'true'
  }
let url = "https://97c4-2a02-ab04-3d2-f800-a1a2-ddb-431c-b6e.ngrok-free.app"
  async function getDataAndRender(start, end) {
    let body = {type:'today'};

  
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
  
      console.log('Post request successful:', result);
  
      Data.distance = result.total;
      Data.duration = result.duration;
      Data.elevation = result.elevation;
      Data.speed = result.speed;
      Data.speeds = result.logs.speed;
      Data.path = result.logs.location;
      Data.parts = result.parts;
      if (!start) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
       renderBar(result);
       renderChart(result.logs.updated, result.logs.altitude);
       loadMap();
    } catch (error) {
      console.error(error);
    }
  }
  
  getDataAndRender()




let Data = Alpine.reactive({
    query:'',
    parts:[],
    Route:{selected:''}, 
    distance: '',
    duration: '',
    elevation: '',
    speed: '',
    path: [],
    speeds:[],
    location:'',
    totalSum:0,

    chartOptions: {
        legend: {
            display: false,
        },
        tooltips: {
            enabled: false,
        },
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
                        display:false
                    
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
        type:'bar',
      label: "Speed",
      backgroundColor: "#99f6e4",
      borderColor: "#99f6e4",
      borderWidth: 2,
      borderRadius:100,
      data: data.logs.speed.map(speed => speed * 3.6)
    },
    {
        type:'bar',
      label: "Speed2",
      backgroundColor: "#99f6e4",
      borderColor: "#99f6e4",
      borderWidth: 2,
      borderRadius: 30,
      data: data.logs.speed.map(speed => speed * -3.6)
    }
  ] 
};

window.myBar = new Chart(ctx12, {
  type: 'bar',
  data: data12,
  options: {
    legend: {
        display: false,
    },
    tooltips: {
        enabled: false,
    },
    responsive: true,
    title: {
      display: false,
      text: 'Chart.js Bar Chart'
    },
    legend: false,
    scales: {
        xAxes: [{
            categoryPercentage: 0.5,
            barPercentage: 1,
            gridLines : {
                display: false,
                drawBorder: false,
                drawTicks: false,

            },
            ticks: {
                display:false,
                fontStyle: 'bold',
                fontSize: 13,
                fontColor: "#333333",
                beginAtZero: true
            }
        }],
        yAxes: [{
            gridLines: {
                display: false,
                drawBorder: false,
                drawTicks: false,
                tickMarkLength: 15,
                borderDashOffset: 15
            },
            ticks: {
                display: false,
                fontStyle: 'bold',
                fontSize: 10,
                beginAtZero: true,
            }
        }]
    }
  }
});}


