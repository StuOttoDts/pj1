import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;



public class LoginServer {

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        

        String url = "jdbc:sqlserver://localhost:1433;"
                   + "databaseName=ProjetinhoContas;"
                   + "encrypt=false;"
                   + "trustServerCertificate=true;";
        String dbUser = "sa";
        String dbPass = "1234";
System.out.println("Tentando conectar no banco: " + url);
        // === ROTA DE LOGIN ===
        server.createContext("/login", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) {
                System.out.println("Request em /login: " + exchange.getRequestMethod());
                try {
                    // ===== CORS =====
                    exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
                    exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
                    exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "*");
                    if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                        exchange.sendResponseHeaders(204, -1);
                        return;
                    }

                    if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                        exchange.sendResponseHeaders(405, -1);
                        return;
                    }

                    InputStream is = exchange.getRequestBody();
                    byte[] bytes = is.readAllBytes();
                    String body = new String(bytes);

                    String[] params = body.split("&");
                    if(params.length < 2) {
                        exchange.sendResponseHeaders(400, -1);
                        return;
                    }

                    String cpf = URLDecoder.decode(params[0].split("=")[1], "UTF-8");
                    String senha = URLDecoder.decode(params[1].split("=")[1], "UTF-8");

                    boolean valid = false;

                    try (Connection con = DriverManager.getConnection(url, dbUser, dbPass);
                         PreparedStatement stmt = con.prepareStatement(
                             "SELECT COUNT(*) FROM Usuarios WHERE cpf = ? AND senha = ?")) {

                        stmt.setString(1, cpf);
                        stmt.setString(2, senha);

                        ResultSet rs = stmt.executeQuery();
                        if (rs.next()) {
                            valid = rs.getInt(1) > 0;
                        }

                    } catch (Exception e) {
                        System.out.println("Erro no banco durante login:");
                        e.printStackTrace();
                        exchange.sendResponseHeaders(500, -1);
                        return;
                    }

                    String response = valid ? "OK" : "ERRO";
                    exchange.sendResponseHeaders(200, response.length());
                    OutputStream os = exchange.getResponseBody();
                    os.write(response.getBytes());
                    os.close();

                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });

        // === ROTA DE REGISTRO ===
        server.createContext("/register", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) {
                try {
                    // ===== CORS =====
                    exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
                    exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
                    exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "*");
                    if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                        exchange.sendResponseHeaders(204, -1);
                        return;
                    }

                    if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                        exchange.sendResponseHeaders(405, -1);
                        return;
                    }

                    InputStream is = exchange.getRequestBody();
                    byte[] bytes = is.readAllBytes();
                    String body = new String(bytes);

                    String[] params = body.split("&");
                    if(params.length < 3) {
                        exchange.sendResponseHeaders(400, -1);
                        return;
                    }

                    String nome = URLDecoder.decode(params[0].split("=")[1], "UTF-8");
                    String cpf = URLDecoder.decode(params[1].split("=")[1], "UTF-8");
                    String senha = URLDecoder.decode(params[2].split("=")[1], "UTF-8");

                    try (Connection con = DriverManager.getConnection(url, dbUser, dbPass);
                         PreparedStatement stmt = con.prepareStatement(
                             "INSERT INTO Usuarios (nomeUsuar, cpf, senha) VALUES (?, ?, ?)")) {

                        stmt.setString(1, nome);
                        stmt.setString(2, cpf);
                        stmt.setString(3, senha);
                        stmt.executeUpdate();

                    } catch (Exception e) {
                        System.out.println("Erro no banco durante registro:");
                        e.printStackTrace();
                        exchange.sendResponseHeaders(500, -1);
                        return;
                    }

                    String response = "OK";
                    exchange.sendResponseHeaders(200, response.length());
                    OutputStream os = exchange.getResponseBody();
                    os.write(response.getBytes());
                    os.close();

                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });

        server.start();
        System.out.println("Servidor rodando em http://localhost:8080");
    }
}
