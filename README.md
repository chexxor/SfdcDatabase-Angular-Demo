# SfdcDatabase-Angular Demo

A simple tool for building Salesforce-backed AngularJS apps.

## Summary

This tools provides an Apex-like API for performing CRUD and query operations on your Salesforce data.

    sfdc.query(soql);
    sfdc.insert(records);
    sfdc.update(records);

## Demo

See a [live demo](https://alexberg-developer-edition.na8.force.com/SfdcDatabaseAngular#/demo), hosted on Force.com Sites.

## Prerequisites

You need git to clone the angular-seed repository. You can get it from
[http://git-scm.com/](http://git-scm.com/).

We also use a number of node.js tools to initialize and test angular-seed. You must have node.js and
its package manager (npm) installed.  You can get them from [http://nodejs.org/](http://nodejs.org/).

## Clone

Clone this repository using [git][git]:

```
git clone https://github.com/angular/angular-seed.git
cd angular-seed
```

## Install Dependencies

* We get the tools we depend upon via `npm`, the [node package manager][npm].
* We get front-end code via `bower`, a [client-side code package manager][bower].

`npm install` script will run `bower install`, so to install all dependencies:

```
npm install
```

* `package.json` - lists the tools we need, installs them to the `node_modules` directory
*  `resource-bundles/sfdcDatabaseAngular_bower.resource/bower_components` - lists the front-end components we need, installs them to the `resource-bundles/sfdcDatabaseAngular_bower.resource/bower_components` directory

## Code History

This project was started by cloning the angular-seed project. If you see some odd scripts or unused code, it probably came from there.