import { afterAll } from "@rstest/core";
import { closeOracle } from "../support/python_oracle.ts";
afterAll(closeOracle);
