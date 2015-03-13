ArchivesSpace 1.1.2 maintenance plugin
======================================

This plugin is used to apply bug fixes and small feature additions from the master branch into a 1.1.2 instance.
If you are running a version greater than v1.1.2, you should remove this plugin


[SUBSCRIBE TO UPDATES](https://github.com/archivesspace/aspace-112-plugin/commits/master.atom)

Usage
-----

Access the ArchivesSpace plugins directory.

```
cd /path/to/archivesspace/plugins
```

Download using git (recommended)
--------------------------------

```
git clone https://github.com/archivesspace/aspace-112-plugin
```

Download using zip
------------------

```
wget https://github.com/lyrasis/aspace-112-plugin/archive/master.zip
unzip master.zip
mv aspace-110-plugin-master aspace-112-plugin
```

Enable the plugin
-----------------

Edit `config.rb` and append ( i.e at the very bottom of the file ) :

```
AppConfig[:plugins] << "aspace-110-plugin"
```

Then restart ArchivesSpace.

Upgrades
--------

Stop ArchivesSpace.

**Git**

Enter the `aspace-112-plugin` directory:

```
git pull origin master
```

**Zip**

Enter the `plugins` directory and remove the existing maintenance plugin:

```
rm -rf aspace-112-plugin
```

Now repeat the download / install steps as above (for zip).

**Complete the upgrade**

Restart ArchivesSpace.

List of bugs fixes / features
-----------------------------

- [Component reordering when holes are introduced in the tree](https://archivesspace.atlassian.net/browse/AR-1143)

---
