implement cli utility using node.js with the following requirenments:
1) it receives the path to the folder 
2) the main feature is to analyse all *.md file in the received folder 
3) find all: links to the files (relative and absolute), links to the external resource http (https). 
4) for each found link test the existance of the resource: 
  - for absolute file links use folder root as a starting point
  - for relataive link check resure existance relatinve to the file where the link was found, 
  - for to check http (https) link use HEAD request (support 3 retries, 5 sec timeout  for the retriable errors). 
5) output result in a table with columns: md file name, found link, is link dead or not (use red for dead links and green for live)
Here some examples for the links:
 - [Dockerfile](https://github.com/larchanka-training/python-typescript-wiki/blob/main/proxy/Dockerfile)
 - [О проекте](01-Обзор%20проекта/О%20проекте.md)
 - [Sprint Demo](./Sprint%20Demo.md).
6) Ignore the following links:
 - anchor links to the same document ([Тестовые сценарии](#тестовые-сценарии))
 - image links like <img ... 
7) links to the files are ulr encoded, decode before use
