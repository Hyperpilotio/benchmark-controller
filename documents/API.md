# API Doc

POST /load-test

```{json}
{
  name: "",
  workflow:["NAME_OF_KEY", ""],
  commandSet: {
    key: {
      name: "",
      binPath: "PATH/TO/COMMAND_TOOL",
      args: ["", ""],
      // NOTE: load-test type should be used by only one command.
      type: "load-test|run",
      verbose: true | false
    }
  }
}
```

## Example (Cassandra)

***deploy.json (for hyperpilotio/deployer)***

```{json}
{
    "name": "cassandra",
    "region": "us-east-1",
    "allowedPorts": [8083, 8086, 7777, 7778, 8089, 6001, 7000, 7001, 7199, 8012, 9042, 9160, 61621],
    "nodeMapping": [
        {
            "task": "cassandra-serve",
            "id": 1
        },
        {
            "task": "monitor",
            "id": 2
        },
        {
            "task": "snap",
            "id": 1
        },
        {
            "task": "cassandra-bench",
            "id": 2
        }
    ],
    "clusterDefinition": {
        "nodes": [
            {
                "instanceType": "t2.medium",
                "id": 1
            },
            {
                "instanceType": "t2.xlarge",
                "id": 2
            }
        ]
    },
    "taskDefinitions": [
        {
            "volumes": [
                {
                    "host": {
                        "sourcePath": "\/"
                    },
                    "name": "root"
                },
                {
                    "host": {
                        "sourcePath": "\/var\/run"
                    },
                    "name": "var_run"
                },
                {
                    "host": {
                        "sourcePath": "\/var\/log"
                    },
                    "name": "var_log"
                },
                {
                    "host": {
                        "sourcePath": "\/sys"
                    },
                    "name": "sys"
                },
                {
                    "host": {
                        "sourcePath": "\/var\/lib\/docker\/"
                    },
                    "name": "var_lib_docker"
                },
                {
                    "host": {
                        "sourcePath": "\/cgroup"
                    },
                    "name": "cgroup"
                }
            ],
            "containerDefinitions": [
                {
                    "mountPoints": [
                        {
                            "readOnly": true,
                            "containerPath": "\/rootfs",
                            "sourceVolume": "root"
                        },
                        {
                            "readOnly": false,
                            "containerPath": "\/var\/run",
                            "sourceVolume": "var_run"
                        },
                        {
                            "readOnly": false,
                            "containerPath": "\/var\/log",
                            "sourceVolume": "var_log"
                        },
                        {
                            "readOnly": true,
                            "containerPath": "\/sys",
                            "sourceVolume": "sys"
                        },
                        {
                            "readOnly": true,
                            "containerPath": "\/sys\/fs\/cgroup",
                            "sourceVolume": "cgroup"
                        },
                        {
                            "readOnly": true,
                            "containerPath": "\/var\/lib\/docker",
                            "sourceVolume": "var_lib_docker"
                        }
                    ],
                    "essential": true,
                    "memory": 200,
                    "cpu": 128,
                    "image": "wen777\/snap:alpine",
                    "name": "snap"
                }
            ],
            "family": "snap"
        },
        {
            "volumes": [],
            "containerDefinitions": [
                {
                    "essential": true,
                    "portMappings": [
                        {
                            "hostPort": 27017,
                            "containerPort": 27017
                        }
                    ],
                    "memory": 1024,
                    "cpu": 1024,
                    "image": "mongo",
                    "name": "mongosrv"
                },
                {
                    "environment": [
                        {
                            "value": "snap",
                            "name": "PRE_CREATE_DB"
                        },
                        {
                            "value": "root",
                            "name": "ADMIN_USER"
                        },
                        {
                            "value": "hyperpilot",
                            "name": "INFLUXDB_INIT_PWD"
                        }
                    ],
                    "essential": true,
                    "portMappings": [
                        {
                            "hostPort": 8083,
                            "containerPort": 8083
                        },
                        {
                            "hostPort": 8086,
                            "containerPort": 8086
                        }
                    ],
                    "memory": 300,
                    "cpu": 512,
                    "image": "tutum\/influxdb",
                    "name": "influxsrv"
                },
                {
                    "environment": [
                        {
                            "value": "localhost",
                            "name": "INFLUXDB_HOST"
                        },
                        {
                            "value": "8086",
                            "name": "INFLUXDB_PORT"
                        },
                        {
                            "value": "snap",
                            "name": "INFLUXDB_NAME"
                        },
                        {
                            "value": "grafana-clock-panel,grafana-piechart-panel",
                            "name": "GF_INSTALL_PLUGINS"
                        },
                        {
                            "value": "root",
                            "name": "INFLUXDB_USER"
                        },
                        {
                            "value": "hyperpilot",
                            "name": "INFLUXDB_PASS"
                        }
                    ],
                    "links": [
                        "influxsrv"
                    ],
                    "essential": true,
                    "portMappings": [
                        {
                            "hostPort": 3000,
                            "containerPort": 3000
                        }
                    ],
                    "memory": 300,
                    "cpu": 512,
                    "image": "grafana\/grafana",
                    "name": "grafana"
                }
            ],
            "family": "monitor"
        },
        {
            "volumes": [
                {
                    "host": {
                        "sourcePath": "\/var\/run\/docker.sock"
                    },
                    "name": "docker_sock"
                }
            ],
            "containerDefinitions": [
                {
                    "portMappings": [
                        {
                            "hostPort": 7199,
                            "containerPort": 7199
                        },
                        {
                            "hostPort": 7000,
                            "containerPort": 7000
                        },
                        {
                            "hostPort": 7001,
                            "containerPort": 7001
                        },
                        {
                            "hostPort": 9160,
                            "containerPort": 9160
                        },
                        {
                            "hostPort": 9042,
                            "containerPort": 9042
                        },
                        {
                            "hostPort": 8012,
                            "containerPort": 8012
                        },
                        {
                            "hostPort": 61621,
                            "containerPort": 61621
                        }
                    ],
                    "essential": true,
                    "memory": 3072,
                    "cpu": 1024,
                    "image": "wen777\/cassandra",
                    "name": "cassandra-serve"
                },
                {
                    "mountPoints": [
                        {
                            "containerPath": "\/var\/run\/docker.sock",
                            "sourceVolume": "docker_sock"
                        }
                    ],
                    "portMappings": [
                        {
                            "hostPort": 7778,
                            "containerPort": 7778
                        }
                    ],
                    "essential": true,
                    "memory": 50,
                    "cpu": 128,
                    "image": "hyperpilot\/benchmark-agent",
                    "name": "benchmark-agent"
                }
            ],
            "family": "cassandra-serve"
        },
        {
            "containerDefinitions": [
                {
                    "essential": true,
                    "portMappings": [
                        {
                            "hostPort": 6001,
                            "containerPort": 6001
                        }
                    ],
                    "memory": 1024,
                    "cpu": 1024,
                    "image": "wen777\/bench:cassandra",
                    "name": "cassandra-bench"
                }
            ],
            "family": "cassandra-bench"
        }
    ]
}
```

POST /api/benchmark

```{json}
{
	"name": "cassandra-test",
	"workflow": ["run"],
	"commandSet": {
		"run": {
			"name": "load-testing",
			"binPath": "/usr/bin/cassandra-stress",
			"args": ["write", "n=400", "-rate", "threads=50", "-node", "cassandra-serve"],
			"type": "load-test"
		}
	}
}
```

Response:
```{json}
{
  "0": "Connected to cluster: Test Cluster, max pending requests per connection 128, max connections per host 8",
  "1": "Datatacenter: datacenter1; Host: cassandra-serve/10.32.0.4; Rack: rack1",
  "2": "Created keyspaces. Sleeping 1s for propagation.",
  "3": "Sleeping 2s...",
  "4": "Warming up WRITE with 50000 iterations...",
  "5": "Running WRITE with 50 threads for 1000000 iteration",
  "6": "type,      total ops,    op/s,    pk/s,   row/s,    mean,     med,     .95,     .99,    .999,     max,   time,   stderr, errors,  gc: #,  max ms,  sum ms,  sdv ms,      mb",
  "7": "total,         10627,   10625,   10625,   10625,     4.7,     3.4,    12.1,    24.2,    47.7,    56.6,    1.0,  0.00000,      0,      0,       0,       0,       0,       0",
  "8": "total,         21765,   11071,   11071,   11071,     4.5,     3.3,     9.6,    29.4,    61.9,    94.2,    2.0,  0.01452,      0,      0,       0,       0,       0,       0",
  "9": "total,         34184,   12292,   12292,   12292,     4.1,     3.2,     9.7,    17.7,    42.1,    52.7,    3.0,  0.03589,      0,      0,       0,       0,       0,       0",
  "10": "total,         48403,   14124,   14124,   14124,     3.5,     2.8,     7.3,    15.6,    35.9,    37.6,    4.0,  0.05634,      0,      0,       0,       0,       0,       0",
  "11": "total,         62479,   13919,   13919,   13919,     3.6,     2.8,     7.6,    17.5,    48.4,    54.2,    5.0,  0.05646,      0,      0,       0,       0,       0,       0",
  "12": "total,         75390,   12582,   12582,   12582,     4.0,     2.7,     9.9,    24.7,    79.9,    83.1,    6.1,  0.04810,      0,      0,       0,       0,       0,       0",
  "13": "total,         87330,   11751,   11751,   11751,     4.2,     2.8,    10.5,    17.3,    88.2,    99.0,    7.1,  0.04119,      0,      0,       0,       0,       0,       0",
  "14": "total,        100699,   13240,   13240,   13240,     3.8,     3.1,     8.1,    16.2,    39.7,    42.8,    8.1,  0.03617,      0,      0,       0,       0,       0,       0",
  "15": "total,        114237,   13681,   13681,   13681,     3.6,     2.8,     7.8,    17.4,    63.7,   105.5,    9.1,  0.03479,      0,      0,       0,       0,       0,       0",
  "16": "total,        127986,   12695,   12695,   12695,     3.9,     2.9,     7.5,    26.5,    72.1,   208.2,   10.2,  0.03146,      0,      0,       0,       0,       0,       0",
  "17": "total,        141020,   12795,   12795,   12795,     3.9,     2.6,    10.2,    18.8,    65.4,    69.5,   11.2,  0.02873,      0,      0,       0,       0,       0,       0",
  "18": "total,        154209,   13060,   13060,   13060,     3.8,     3.0,     7.8,    13.7,    68.0,    75.9,   12.2,  0.02677,      0,      0,       0,       0,       0,       0",
  "19": "total,        168340,   13555,   13555,   13555,     3.7,     2.7,     8.1,    15.6,    62.1,    65.8,   13.2,  0.02545,      0,      0,       0,       0,       0,       0",
  "20": "total,        183762,   15307,   15307,   15307,     3.2,     2.2,     8.9,    13.5,    52.1,    55.3,   14.2,  0.02763,      0,      0,       0,       0,       0,       0",
  "21": "total,        198480,   14582,   14582,   14582,     3.4,     2.2,     8.5,    17.8,    69.5,   209.0,   15.2,  0.02626,      0,      0,       0,       0,       0,       0",
  "22": "total,        212372,   13811,   13811,   13811,     3.6,     2.6,     8.3,    16.2,    61.6,    63.6,   16.3,  0.02500,      0,      0,       0,       0,       0,       0",
  "23": "total,        222014,    9501,    9501,    9501,     5.2,     3.7,    11.3,    42.6,   110.1,   138.3,   17.3,  0.02696,      0,      0,       0,       0,       0,       0",
  "24": "total,        235740,   13461,   13461,   13461,     3.7,     2.6,     8.4,    16.2,    62.5,    74.4,   18.3,  0.02563,      0,      0,       0,       0,       0,       0",
  "25": "total,        250089,   14225,   14225,   14225,     3.5,     2.5,     8.0,    16.1,    55.1,    70.8,   19.3,  0.02440,      0,      0,       0,       0,       0,       0",
  "26": "total,        265038,   14869,   14869,   14869,     3.3,     2.6,     7.6,    13.2,    50.1,    58.3,   20.3,  0.02361,      0,      0,       0,       0,       0,       0",
  "27": "total,        278856,   13702,   13702,   13702,     3.6,     2.8,     8.3,    11.7,    56.9,    58.2,   21.3,  0.02264,      0,      0,       0,       0,       0,       0",
  "28": "total,        289941,   10972,   10972,   10972,     4.5,     3.2,    10.2,    18.5,    88.4,   205.2,   22.3,  0.02265,      0,      0,       0,       0,       0,       0",
  "29": "total,        302821,   12783,   12783,   12783,     3.9,     2.7,     8.9,    17.4,   106.5,   111.1,   23.3,  0.02173,      0,      0,       0,       0,       0,       0",
  "30": "total,        318492,   15269,   15269,   15269,     3.3,     2.4,     7.2,    12.1,    48.0,   211.4,   24.4,  0.02137,      0,      0,       0,       0,       0,       0",
  "31": "total,        333182,   14672,   14672,   14672,     3.4,     2.6,     7.5,    15.1,    51.7,    70.7,   25.4,  0.02069,      0,      0,       0,       0,       0,       0",
  "32": "total,        348032,   14628,   14628,   14628,     3.4,     2.3,     7.9,    15.2,    74.1,    83.0,   26.4,  0.02056,      0,      0,       0,       0,       0,       0",
  "33": "total,        362493,   13613,   13613,   13613,     3.7,     2.7,     8.3,    13.0,    78.0,    79.9,   27.4,  0.01989,      0,      0,       0,       0,       0,       0",
  "34": "total,        374286,   11503,   11503,   11503,     4.3,     2.5,    12.1,    24.7,   102.7,   111.7,   28.5,  0.01943,      0,      0,       0,       0,       0,       0",
  "35": "total,        389498,   14927,   14927,   14927,     3.3,     2.2,     8.3,    14.9,    52.2,    64.8,   29.5,  0.01930,      0,      0,       0,       0,       0,       0",
  "36": "total,        403521,   13829,   13829,   13829,     3.6,     2.3,     9.8,    17.3,    55.9,    70.3,   30.5,  0.01865,      0,      0,       0,       0,       0,       0",
  "37": "total,        417952,   14359,   14359,   14359,     3.5,     2.7,     8.0,    13.4,    58.4,    62.1,   31.5,  0.01828,      0,      0,       0,       0,       0,       0",
  "38": "total,        431993,   13935,   13935,   13935,     3.6,     2.7,     7.1,    14.5,    62.3,    65.3,   32.5,  0.01779,      0,      0,       0,       0,       0,       0",
  "39": "total,        444319,   12231,   12231,   12231,     4.0,     2.6,    10.4,    19.9,    75.5,    76.8,   33.5,  0.01735,      0,      0,       0,       0,       0,       0",
  "40": "total,        460100,   15298,   15298,   15298,     3.3,     2.6,     6.4,    13.3,    80.3,    91.3,   34.5,  0.01765,      0,      0,       0,       0,       0,       0",
  "41": "total,        475546,   15351,   15351,   15351,     3.2,     2.4,     7.1,    12.0,    79.7,    84.9,   35.5,  0.01789,      0,      0,       0,       0,       0,       0",
  "42": "total,        489960,   14319,   14319,   14319,     3.5,     2.5,     7.6,    15.7,    86.6,    87.6,   36.6,  0.01762,      0,      0,       0,       0,       0,       0",
  "43": "total,        503189,   13190,   13190,   13190,     3.8,     2.6,     8.4,    14.0,   106.5,   213.8,   37.6,  0.01716,      0,      0,       0,       0,       0,       0",
  "44": "total,        517339,   14059,   14059,   14059,     3.5,     2.5,     8.2,    13.5,    92.3,    93.7,   38.6,  0.01686,      0,      0,       0,       0,       0,       0",
  "45": "total,        528537,   11110,   11110,   11110,     4.5,     2.9,    11.2,    25.2,    93.5,    97.8,   39.6,  0.01737,      0,      0,       0,       0,       0,       0",
  "46": "total,        542159,   13697,   13697,   13697,     3.6,     2.5,     8.4,    18.0,    89.1,    89.5,   40.6,  0.01699,      0,      0,       0,       0,       0,       0",
  "47": "total,        556742,   13525,   13525,   13525,     3.7,     2.5,     8.1,    13.7,    77.3,    81.2,   41.6,  0.01662,      0,      0,       0,       0,       0,       0",
  "48": "total,        571754,   14871,   14871,   14871,     3.3,     2.3,     8.0,    15.4,    56.3,    81.6,   42.7,  0.01642,      0,      0,       0,       0,       0,       0",
  "49": "total,        587059,   15198,   15198,   15198,     3.3,     2.3,     8.2,    13.4,    76.7,   103.5,   43.7,  0.01641,      0,      0,       0,       0,       0,       0",
  "50": "total,        603734,   16485,   16485,   16485,     3.0,     2.3,     7.1,    11.3,    50.1,    53.9,   44.7,  0.01673,      0,      0,       0,       0,       0,       0",
  "51": "total,        620293,   16467,   16467,   16467,     3.0,     2.1,     6.5,    13.4,    65.6,    67.2,   45.7,  0.01708,      0,      0,       0,       0,       0,       0",
  "52": "total,        638363,   17958,   17958,   17958,     2.8,     2.1,     6.2,    12.5,    42.0,   205.1,   46.7,  0.01778,      0,      0,       0,       0,       0,       0",
  "53": "total,        653076,   14640,   14640,   14640,     3.4,     2.3,     7.5,    17.2,    88.0,    89.3,   47.7,  0.01751,      0,      0,       0,       0,       0,       0",
  "54": "total,        668936,   15792,   15792,   15792,     3.2,     1.9,     6.4,    12.8,   121.9,   204.5,   48.7,  0.01726,      0,      0,       0,       0,       0,       0",
  "55": "total,        686277,   17250,   17250,   17250,     2.9,     2.1,     6.8,    10.3,    74.9,    79.6,   49.7,  0.01777,      0,      0,       0,       0,       0,       0",
  "56": "total,        700045,   13695,   13695,   13695,     3.6,     2.6,     8.7,    14.3,   109.6,   114.5,   50.7,  0.01743,      0,      0,       0,       0,       0,       0",
  "57": "total,        713506,   13403,   13403,   13403,     3.7,     2.5,     8.1,    18.8,   107.7,   118.2,   51.7,  0.01708,      0,      0,       0,       0,       0,       0",
  "58": "total,        727030,   13470,   13470,   13470,     3.7,     2.3,     8.8,    15.6,   124.6,   136.7,   52.7,  0.01676,      0,      0,       0,       0,       0,       0",
  "59": "total,        744424,   17527,   17527,   17527,     2.8,     2.2,     6.5,    12.5,    47.0,    55.7,   53.7,  0.01706,      0,      0,       0,       0,       0,       0",
  "60": "total,        760060,   14995,   14995,   14995,     3.3,     2.5,     7.4,    13.3,    54.5,    55.7,   54.7,  0.01677,      0,      0,       0,       0,       0,       0",
  "61": "total,        774663,   14520,   14520,   14520,     3.4,     2.2,     9.6,    31.7,    40.4,    52.6,   55.8,  0.01647,      0,      0,       0,       0,       0,       0",
  "62": "total,        793322,   18562,   18562,   18562,     2.7,     2.0,     5.9,     9.5,    68.7,    69.9,   56.8,  0.01725,      0,      0,       0,       0,       0,       0",
  "63": "total,        809547,   16131,   16131,   16131,     3.1,     2.3,     7.6,    12.7,    67.7,    70.3,   57.8,  0.01716,      0,      0,       0,       0,       0,       0",
  "64": "total,        827976,   18346,   18346,   18346,     2.7,     1.9,     5.7,    12.0,    60.6,   204.9,   58.8,  0.01762,      0,      0,       0,       0,       0,       0",
  "65": "total,        847286,   19183,   19183,   19183,     2.6,     1.9,     5.9,     9.7,    48.7,    50.2,   59.8,  0.01821,      0,      0,       0,       0,       0,       0",
  "66": "total,        865712,   18302,   18302,   18302,     2.7,     1.8,     6.6,    14.7,    45.0,    45.8,   60.8,  0.01841,      0,      0,       0,       0,       0,       0",
  "67": "total,        878298,   12518,   12518,   12518,     4.0,     2.7,     9.2,    25.0,    67.0,    72.8,   61.8,  0.01822,      0,      0,       0,       0,       0,       0",
  "68": "total,        895228,   16797,   16797,   16797,     3.0,     2.2,     6.5,    14.8,    53.8,    55.3,   62.8,  0.01811,      0,      0,       0,       0,       0,       0",
  "69": "total,        911555,   16166,   16166,   16166,     3.1,     2.1,     7.3,    20.7,    52.8,   206.5,   63.8,  0.01784,      0,      0,       0,       0,       0,       0",
  "70": "total,        929125,   17341,   17341,   17341,     2.9,     1.9,     6.7,    12.3,    67.8,    68.9,   64.8,  0.01768,      0,      0,       0,       0,       0,       0",
  "71": "total,        944512,   15658,   15658,   15658,     3.2,     2.3,     6.8,    16.5,    54.1,    57.6,   65.8,  0.01741,      0,      0,       0,       0,       0,       0",
  "72": "total,        960074,   14877,   14877,   14877,     3.3,     2.2,     7.7,    28.8,    68.0,    68.9,   66.8,  0.01715,      0,      0,       0,       0,       0,       0",
  "73": "total,        977946,   17689,   17689,   17689,     2.8,     1.8,     6.5,    11.3,    96.8,    97.8,   67.9,  0.01733,      0,      0,       0,       0,       0,       0",
  "74": "total,        994773,   17257,   17257,   17257,     2.9,     2.0,     5.9,    12.1,    78.8,   204.2,   68.8,  0.01716,      0,      0,       0,       0,       0,       0",
  "75": "total,       1000000,   18274,   18274,   18274,     2.7,     1.9,     5.7,    15.1,    54.9,    55.9,   69.1,  0.01802,      0,      0,       0,       0,       0,       0",
  "76": "Results:",
  "77": "END",
  "op rate": "14467 [WRITE:14467]",
  "partition rate": "14467 [WRITE:14467]",
  "row rate": "14467 [WRITE:14467]",
  "latency mean": "3.4 [WRITE:3.4]",
  "latency median": "2.4 [WRITE:2.4]",
  "latency 95th percentile": "7.3 [WRITE:7.3]",
  "latency 99th percentile": "12.8 [WRITE:12.8]",
  "latency 99.9th percentile": "53.9 [WRITE:53.9]",
  "latency max": "213.8 [WRITE:213.8]",
  "Total partitions": "1000000 [WRITE:1000000]",
  "Total errors": "0 [WRITE:0]",
  "total gc count": "0",
  "total gc mb": "0",
  "total gc time (s)": "0",
  "avg gc time(ms)": "NaN",
  "stdev gc time(ms)": "0",
  "Total operation time": "00:01:09"
}
```

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/6545939a04f3f21a0a32)
