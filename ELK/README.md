# ELK 

## Summary

- this docker compose is for ELK creation

- before launch it, you need to create two folder for volumes
    - ~/project/elasticsearch_data

- launch command
    - docker-compose up -d

- access Kibana
    - http://localhost:5601

## Take out logstash

- Coz in dotnet, there is a serilog can do what logstash do, therefore no need logstash.

## Kibana, Elasticsearch

- if do not wannt setup enrollment token, then change the env => xpack.security.enabled=true, in elasticsearch
- to generate enrollment token
    - docker exec -it elasticsearch /usr/share/elasticsearch/bin/elasticsearch-create-enrollment-token -s kibana

## 使用 curl 發送 Elasticsearch log 訊息

此文件將引導您如何使用 `curl` 發送一筆模擬的 log 訊息到運行中的 Elasticsearch 伺服器。此範例基於 Dotnet Web API 的日志格式。

### 步驟

1. **準備環境**：
   - 確保您已經安裝並運行 Elasticsearch 伺服器。
   - 確保 Elasticsearch 伺服器的 HTTP 端口是開放的，通常為 `9200`。

2. **發送日志的 curl 命令**：
   使用以下 `curl` 命令來發送一筆日志到 Elasticsearch：

   ```bash
   curl -X POST "http://localhost:9200/dotnet-webapi-logs-2025.01.29/_doc/" \
   -H "Content-Type: application/json" \
   -d '
   {
     "@timestamp": "2025-01-29T01:00:00.0000000+08:00",
     "level": "Information",
     "messageTemplate": "{HostingRequestFinishedLog:l}",
     "message": "Request finished HTTP/1.1 GET https://localhost:7094/WeatherForecast?k=123 - - - 200 - application/json;+charset=utf-8 2.0632ms",
     "fields": {
       "ElapsedMilliseconds": 2.0632,
       "StatusCode": 200,
       "ContentType": "application/json; charset=utf-8",
       "ContentLength": null,
       "Protocol": "HTTP/1.1",
       "Method": "GET",
       "Scheme": "https",
       "Host": "localhost:7094",
       "PathBase": "",
       "Path": "/WeatherForecast",
       "QueryString": "?k=123",
       "HostingRequestFinishedLog": "Request finished HTTP/1.1 GET https://localhost:7094/WeatherForecast?k=123 - - - 200 - application/json;+charset=utf-8 2.0632ms",
       "EventId": {
         "Id": 2
       },
       "SourceContext": "Microsoft.AspNetCore.Hosting.Diagnostics",
       "RequestId": "0HN9VMMVC4D2G:00000002",
       "RequestPath": "/WeatherForecast",
       "ConnectionId": "0HN9VMMVC4D2G",
       "Environment": "Development",
       "Application": "DotnetWebApi"
     },
     "renderings": {
       "HostingRequestFinishedLog": [
         {
           "Format": "l",
           "Rendering": "Request finished HTTP/1.1 GET https://localhost:7094/WeatherForecast?k=123 - - - 200 - application/json;+charset=utf-8 2.0632ms"
         }
       ]
     }
   }
   '
   ```