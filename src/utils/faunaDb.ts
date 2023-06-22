import { Client, query } from "faunadb";
import randomString from "./randomString";

type FaunaResult = {
  ref: any;
  ts: number;
  data: {
    source: string;
    target: string;
  };
};

const getUrlByShort = async (
  client: Client,
  short: string,
): Promise<FaunaResult | undefined> => {
  // Lookup short in FaunaDb & get the longUrl if it exists
  try {
    const response: { data: FaunaResult[] } = await client.query(
      query.Map(
        query.Paginate(
          query.Match(query.Index("shortCodesBySource"), short.toLowerCase()),
        ),
        query.Lambda("shortcodes", query.Get(query.Var("shortcodes"))),
      ),
    );

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
  } catch (err) {
    console.log(err);
  }

  return undefined;
};

const getUrlByLong = async (
  client: Client,
  long: string,
): Promise<FaunaResult | undefined> => {
  // Lookup long in FaunaDb & get the long if it exists
  try {
    const response: { data: FaunaResult[] } = await client.query(
      query.Map(
        query.Paginate(
          query.Match(query.Index("shortCodesByTarget"), long.toLowerCase()),
        ),
        query.Lambda("shortcodes", query.Get(query.Var("shortcodes"))),
      ),
    );

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
  } catch (err) {
    console.log(err);
  }

  return undefined;
};

const createUrl = async (
  client: Client,
  long: string,
  short: string,
): Promise<FaunaResult | undefined> => {
  try {
    return await client.query(
      query.Create(query.Collection("shortcodes"), {
        data: {
          source: short.toLowerCase(),
          target: long.toLowerCase(),
        },
      }),
    );
  } catch (err) {
    console.log(err);
    return undefined;
  }
};

export { getUrlByShort, getUrlByLong, createUrl };
