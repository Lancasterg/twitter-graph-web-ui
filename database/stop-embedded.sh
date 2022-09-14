NEO4J_ROOT=`dirname "$0"`/neo4j-community-3.5.3

echo "Stopping embedded Neo4J server..."
$NEO4J_ROOT/bin/neo4j stop