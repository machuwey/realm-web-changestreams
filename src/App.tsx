import React, { useState, useEffect } from "react";
import * as Realm from "realm-web";
import { useTransition, animated } from "react-spring";
import { timeSince } from "./utils";
import { tokenImages, tokenTicker } from "./tokenImages";
import { OpenNewWindow, User } from "iconoir-react";
const app = new Realm.App({ id: "application-0-oolcn" });

type Swap = {
    _id: string;
    exchange: string;
    sell_token: string;
    buy_token: string;
    pair: string;
    block_number: number;
    block_time: number;
    transaction_hash: string;
    taker_address: string;
    sell_amount: number;
    buy_amount: number;
    beneficiary_address: string;
    timestamp: string;
};

const itemHeight = 24; // Height of each item
const maxItems = 20; // Maximum number of items to display


const App = () => {
  const [user, setUser] = useState<Realm.User | null>(null);
  const [displayEvents, setDisplayEvents] = useState<Swap[]>([]);

  useEffect(() => {
    const login = async () => {
      const user = await app.logIn(Realm.Credentials.anonymous());
      setUser(user);

      if (app.currentUser === null) {
        console.log("No user logged in");
        return;
      }

      const mongodb = app.currentUser.mongoClient("mongodb-atlas");
      const collection = mongodb.db("apibara-example").collection("swaps");

      
      
    const initialData = await collection.find({}, { sort: { block_time: -1 } });
    setDisplayEvents(initialData);
    console.log("initialData", initialData);
    
      for await (const change of collection.watch()) {
        if (change.operationType === "insert") {
          setDisplayEvents((prevDisplayEvents) => {
            // Use the most recent state to check if the event already exists
            const newSwap = change.fullDocument as Swap;
            const exists = prevDisplayEvents.some(
              (swap) =>
                swap._id.toString() ===
                newSwap._id.toString()
            );
            console.log("events", prevDisplayEvents);
            console.log("change", change);
            console.log("exists", exists);
            if (!exists) {
              // If it doesn't exist, prepend the new event
              return [newSwap, ...prevDisplayEvents];
            } else {
              // If it does exist, just return the previous state
              return prevDisplayEvents;
            }
          });
        } else if (change.operationType === "delete") {
          setDisplayEvents((prevDisplayEvents) => {
            // Use the most recent state to remove the event
            const idToDelete = change.documentKey._id.toString();
            console.log("idToDelete", idToDelete);
            return prevDisplayEvents.filter(
              (swap) => swap._id.toString() !== idToDelete
            );
          });
        }
      }
    };
    login();
  }, []);

  // Animation transitions
  const transitions = useTransition(displayEvents, {
    from: { transform: "translate3d(0,-40px,0)", opacity: 0 },
    enter: { transform: "translate3d(0,0px,0)", opacity: 1 },
    leave: { transform: "translate3d(0,-40px,0)", opacity: 0 },
    update: { transform: "translate3d(0,0px,0)", opacity: 1 },
    keys: displayEvents.map((item, index) => index),
  });


  return (
    <div className="App">
      <div className="text-3xl font-bold text-center mt-10">MiniSwapScan</div>
      {!!user && (
        <div className="App-header">
          {/* Block Quote */}
          <div className="text-center bg-gray-100 p-4 rounded-lg">
            <blockquote>
              <p>
                This is a demonstration app of using Apibara to build a
                a real-time swap scanner.
              </p>
            </blockquote>
          </div>
          <div>
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <td>Index</td>
                  <td>Operation</td>
                  <td>Taker Address</td>
                  <td>Transaction Hash</td>
                  <td>Block Time</td>
                </tr>
              </thead>

              <tbody className="">
                {transitions((style, item, t, index) => (
                  <animated.tr key={index} style={style}>
                     
                    <td>{index}</td>

                    {/*
                    <td>{item.documentKey._id.toString()}</td>
                    */}

                    {/* From x to y  section */}
                    <td >
                      <div className="flex flex-row items-center">
                       
                      <div className="flex flex-row items-center">
                        <img
                          src={
                            tokenImages[item.sell_token] ||
                            "default_image_path"
                          }
                          alt="Sell Token"
                          className="h-6 w-6"
                        />
                        <div>
                          {Number(item.sell_amount).toFixed(5)}
                        </div>
                        <div>{tokenTicker[item.sell_token]}</div>
                      </div>
                      <div className="flex flex-row items-center">{"->"}</div>
                      <div className="flex flex-row items-center">
                        <img
                          src={
                            tokenImages[item.buy_token] ||
                            "default_image_path"
                          }
                          alt="Buy Token"
                          className="h-6 w-6"
                        />
                        <div>
                          {Number(item.buy_amount).toFixed(5)}
                        </div>
                        <div>{tokenTicker[item.buy_token]}</div>
                      </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-row items-center">
                      <a
                        href={`https://voyager.online/contract/${item.taker_address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-row items-center"
                      >
                        <User className="h-6 w-6" />
                        <div>
                          {`${item.taker_address.substring(
                            0,
                            12
                          )}...`}
                        </div>
                        <OpenNewWindow className="h-6 w-6" />
                      </a>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-row items-center">
                      <div>Tx</div>
                      <a
                        href={`https://voyager.online/tx/${item.transaction_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-row items-center"
                      >
                        <div>
                          {`${item.transaction_hash.substring(
                            0,
                            12
                          )}...`}
                        </div>
                        <OpenNewWindow className="h-6 w-6" />
                      </a>
                  </div>
                    </td>

                    <td>
                      {timeSince(
                            new Date(item.block_time * 1000)
                          )
                        }
                    </td>
                    
                  </animated.tr>
                ))}
              </tbody>
            </table>
          </div>
        
        </div>
      )}
    </div>
  );
};

export default App;
